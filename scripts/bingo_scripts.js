function focusOnDraw()
{
  document.getElementById('btnDraw').focus();
} // focusOnDraw()


function goFullScreen()
{
  var elem = document.getElementById('mainContainer');
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) { /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
    elem.msRequestFullscreen();
  }
}


var app = angular.module('bingo_web', []);

app.controller('controllerMain', function($scope, $sce, $window) {
  // Constants
  $scope.GRID_ELEMENTS = {
    LETTERS: ['B', 'I', 'N', 'G', 'O'],
    NUMBERS: Array.apply(null, Array(15)).map(function(number, index) { return index; }),
  };
  $scope.ACTIONS = {
    RESET: 0,
    DRAW:  1,
    MAGIC: 2,
    INFO:  3
  };
  $scope.NUMBER_MAGIC_NUMBERS = 10;
  $scope.CHOICES_MAGIC_NUMBERS = [2, 1];
  $scope.NUMBER_BALLS = $scope.GRID_ELEMENTS.LETTERS.length * $scope.GRID_ELEMENTS.NUMBERS.length;
  $scope.LABEL_BINGO = '春酒賓果!';


  $scope.roulette = {

    // Properties
    indexCurrentBall: -1,
    indexCurrentMagicNumber: -1,
    balls: Array.apply(null, Array($scope.NUMBER_BALLS))
      .map(function (ball, index) {
        var
          indexLetter = Math.trunc(index / $scope.GRID_ELEMENTS.NUMBERS.length),
          letter = $scope.GRID_ELEMENTS.LETTERS[indexLetter],
          number = index + 1,
          paddedNumber = padLeft(number, 2);
        return {
          number:         paddedNumber,
          reading:        number, // letter + '-' + number,
          isDrawn:        false
        };
      }),
    magicNumbers: Array.apply(null, Array($scope.NUMBER_MAGIC_NUMBERS))
      .map(function (val, index) { return false; }),
    ordering: Array.apply(null, Array($scope.NUMBER_BALLS)).map(function (val, index) { return index; }),
    orderingMagicNumbers: Array.apply(null, Array($scope.NUMBER_MAGIC_NUMBERS)).map(function (val, index) { return index; }),
    info: {
      action:             $scope.ACTIONS.RESET,
      order:              '',      
      reading:            $scope.LABEL_BINGO,
      indexBallDisplayed: -1,
      indexFirstDraw:     -1
    },

    // Methods

    displayBallInfo: function(indexBall, action) {
      this.info.action = action;
      
      // Determine handling from action
      switch (action)
      {
        case $scope.ACTIONS.MAGIC:
          this.info.magic = '';
          // Go through all magic numbers
          for (var i = 0, iLen = $scope.NUMBER_MAGIC_NUMBERS; i < iLen; i++)
          {
            // Check if drawn
            if (this.magicNumbers[i])
            {
              this.info.magic += i + ', ';
            } // if magic was drawn
          } // for all magic numbers i 
          // Remove last comma if it exists
          if (this.info.magic.length)
            this.info.magic = this.info.magic.substr(0, this.info.magic.length - ', '.length);

          this.info.indexBallDisplayed = this.indexCurrentBall;
          this.info.reading = indexBall + ' 個福號'; //+ ' magic'
          this.info.order = '';
          this.info.indexFirstDraw = this.indexCurrentBall + 1;
          $window.focusOnDraw();
          break;

        case $scope.ACTIONS.DRAW:
          // Set indexFirstDraw the first time "Draw" is pressed
          if (this.info.indexFirstDraw == -1)
            this.info.indexFirstDraw = this.indexCurrentBall;
          this.info.indexBallDisplayed = this.indexCurrentBall;
          this.info.reading = this.balls[indexBall].reading;
          this.info.order = 'Ball ' + (this.indexCurrentBall + 1).toString();
          break;

        case $scope.ACTIONS.INFO:
          this.info.indexBallDisplayed = this.ordering.indexOf(indexBall);
          this.info.reading = this.balls[indexBall].reading;
          this.info.order = ((this.info.indexBallDisplayed >= this.info.indexFirstDraw)
            ? ((this.indexCurrentBall < ($scope.NUMBER_BALLS - 1))
              ? ((this.balls[indexBall].isDrawn)
                ? 'Ball ' + (this.info.indexBallDisplayed + 1).toString() + ' of ' + (this.indexCurrentBall + 1).toString()
                : '未抽中號碼'
              )
              : '最後一球'
            )
            : '福號 (' + ((indexBall + 1) % 10) + ')'
          );
          break;

        case $scope.ACTIONS.RESET:
        default:
          break;
      } // switch action
    }, // displayBallInfo()

    viewBallHistory: function(step) {
      this.displayBallInfo(
        this.ordering[this.info.indexBallDisplayed + step],
        $scope.ACTIONS.INFO
      );
    }, // viewBallHistory()

    reset: function() {
      // Confirm process
      if (confirm('確定離開遊戲?'))
      {
        // Go through all drawn balls
        for (var i = 0; i <= this.indexCurrentBall; i++)
        {
          // Reset drawn status
          this.balls[this.ordering[i]].isDrawn = false;
        } // for all balls i
        // Go through all magic numbers
        for (var i = 0; i <= this.indexCurrentMagicNumber; i++)
        {
          // Reset drawn status
          this.magicNumbers[this.orderingMagicNumbers[i]] = false;
        } // for all magic numbers i
        this.indexCurrentBall = -1;
        this.indexCurrentMagicNumber = -1;
        this.ordering = Array.apply(null, Array($scope.NUMBER_BALLS)).map(function (val, index) { return index; });
        this.orderingMagicNumbers = Array.apply(null, Array($scope.NUMBER_MAGIC_NUMBERS)).map(function (val, index) { return index; });
        this.info.magic = '';
        this.info.order = '';
        this.info.reading = $scope.LABEL_BINGO;
        this.info.indexBallDisplayed = -1;
        this.info.indexFirstDraw = -1;
        this.displayBallInfo(this.ordering[this.indexCurrentBall], $scope.ACTIONS.RESET);
        $window.focusOnDraw();
      } // if confirm()
    }, // reset()

    // Swap numbers. 
    swap: function(array, a, b) {
      // Check if a and b are different
      // Must be different, otherwise they will both be zero (reference-based)
      if (a != b)
      {
        array[a] = array[a] + array[b];
        array[b] = array[a] - array[b];
        array[a] = array[a] - array[b];
      } // if different
    }, // swap()

    mix: function(array, indexStart, numberChoices) {
      // Go through all balls
      for (var i = indexStart, iLen = numberChoices - 1; i < iLen; i++)
      {
        this.swap(array, i, getRandomInt(indexStart, iLen));
      } // for all balls i
    }, // mix()

    drawBall: function() {
      this.indexCurrentBall += 1;
      this.mix(this.ordering, this.indexCurrentBall, $scope.NUMBER_BALLS);
      this.balls[this.ordering[this.indexCurrentBall]].isDrawn = true;
      this.displayBallInfo(this.ordering[this.indexCurrentBall], $scope.ACTIONS.DRAW);
    }, // drawBall()

    drawMagic: function(numberMagic) {
      // Repeat numberMagic times
      for (var i = numberMagic; i > 0; i--)
      {
        this.indexCurrentMagicNumber += 1;
        this.mix(this.orderingMagicNumbers, this.indexCurrentMagicNumber, $scope.NUMBER_MAGIC_NUMBERS);
        // Mark magic number as drawn
        this.magicNumbers[this.orderingMagicNumbers[this.indexCurrentMagicNumber]] = true;
        // Go through all balls ending in magic number
        for (var j = this.orderingMagicNumbers[this.indexCurrentMagicNumber] - 1, jLen = $scope.NUMBER_BALLS; j < jLen; j += 10)
        {
          // Skip to 10 if magic number is 0
          if (j == -1) continue;
          // Update current index of drawn
          this.indexCurrentBall += 1;
          // Mark ball as magic and drawn
          this.balls[j].isDrawn = true;
          // Delete from ball ordering
          this.ordering.splice(this.ordering.indexOf(j), 1);
          // Add to current index of ball ordering
          this.ordering.splice(this.indexCurrentBall, 0, j);
        } // for all balls ending in magic number j
      } // repeat numberMagic times with i
      this.displayBallInfo(numberMagic, $scope.ACTIONS.MAGIC);
    } // drawMagic()

  }; // $scope.roulette

  // Pre-load filled ball images
  $scope.HTML_PRELOAD_IMAGES = Array.apply(null, Array($scope.NUMBER_BALLS))
    .map(function (ball, index) {
      return '<img src="images/1_' + padLeft(index + 1, 2).toString() + '.png" alt="" />';
    }).join('');


  $scope.renderHtml = function(htmlCode)
  {
    // Check if the string is not empty
    if ((htmlCode) && (htmlCode.length > 0))
    {
      return $sce.trustAsHtml(htmlCode);
    } // if htmlCode

      // Return a non-breaking space so that the div still contains some text to pad
      return '&#160;';
    }; // renderHtml()
  
}); // app.controller - controller


// https://stackoverflow.com/a/5367656  
function padLeft(strToPad, n, strPadValue)
{
  return Array(n - String(strToPad).length + 1).join(strPadValue || '0') + strToPad;
}  // padLeft()


// https://teamtreehouse.com/community/to-generate-a-random-number-between-0-and-20
// Will return a number inside the given range, inclusive of both minimum and maximum
// i.e. if min=0, max=20, returns a number from 0-20
function getRandomInt(min, max) 
{
  return Math.floor(Math.random() * (max - min + 1)) + min;
} // getRandomInt()
