function initialize()
{
  document.getElementById('btnDraw').focus();
} // initialize()


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
    NUMBERS: Array.apply(null, Array(15)).map(function(number, index) { return index; })
  };
  $scope.ACTIONS = {
    RESET: 0,
    DRAW:  1,
    MAGIC: 2,
    INFO:  3
  };
  $scope.NUMBER_MAGIC_NUMBERS = 10;
  $scope.NUMBER_BALLS = $scope.GRID_ELEMENTS.LETTERS.length * $scope.GRID_ELEMENTS.NUMBERS.length;
  $scope.LABEL_BINGO = 'BINGO!';


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
          reading:        letter +'-' + number,
          suffixFilename: '_' + paddedNumber + '.png',
          isDrawn:        false,
          isMagic:        false
        };
      }),
    magicNumbers: Array.apply(null, Array($scope.NUMBER_MAGIC_NUMBERS))
      .map(function (val, index) {
        return {
          number:  index,
          isDrawn: false
        };
      }),
    ordering: Array.apply(null, Array($scope.NUMBER_BALLS)).map(function (val, index) { return index; }),
    orderingMagicNumbers: Array.apply(null, Array($scope.NUMBER_MAGIC_NUMBERS)).map(function (val, index) { return index; }),
    info: {
      action:  $scope.ACTIONS.RESET,
      order:   '',      
      reading: $scope.LABEL_BINGO
    },

    // Methods

    displayBallInfo: function(indexBall, action) {
      this.info.action = action;
      
      // Determine handling from action
      switch (action)
      {
        case $scope.ACTIONS.MAGIC:
          this.info.magic = this.magicNumbers
            .filter(function (magic) { return (magic.isDrawn); })
            .map(function (magic) { return magic.number; })
            .join(', ');
          this.info.reading = this.orderingMagicNumbers[this.indexCurrentMagicNumber];
          this.info.order = '';
          break;
        case $scope.ACTIONS.DRAW:
          this.info.reading = this.balls[indexBall].reading;
          this.info.order = 'Ball ' + (this.indexCurrentBall + 1).toString();
          break;
        case $scope.ACTIONS.INFO:
          this.info.reading = this.balls[indexBall].reading;
          this.info.order = ((this.indexCurrentBall < ($scope.NUMBER_BALLS - 1))
            ? ((this.balls[indexBall].isDrawn)
              ? 'Ball ' + (this.ordering.indexOf(indexBall) + 1).toString() + ' of ' + (this.indexCurrentBall + 1).toString()
              : 'Not yet drawn'
            )
            : 'Last Ball'
          );
          break;
        case $scope.ACTIONS.RESET:
        default:
          break;
      } // switch action
    }, // displayBallInfo()

    reset: function() {
      // Confirm process
      if (confirm('Really end this game?'))
      {
        this.indexCurrentBall = -1;
        this.indexCurrentMagicNumber = -1;
        this.balls.forEach(function (ball) {
          ball.isDrawn = false;
          ball.isMagic = false;
        });
        this.magicNumbers.forEach(function (magic) {
          magic.isDrawn = false;
        });
        this.ordering = Array.apply(null, Array($scope.NUMBER_BALLS)).map(function (val, index) { return index; });
        this.orderingMagicNumbers = Array.apply(null, Array($scope.NUMBER_MAGIC_NUMBERS)).map(function (val, index) { return index; });
        this.info.magic = '';
        this.info.order = '';
        this.info.reading = $scope.LABEL_BINGO;
        this.displayBallInfo(this.ordering[this.indexCurrentBall], $scope.ACTIONS.RESET);
        $window.initialize();
      } // if confirm()
    }, // reset()

    swapBalls: function(a, b) {
      var tempValue = this.ordering[a];
      this.ordering[a] = this.ordering[b];
      this.ordering[b] = tempValue;
    }, // swapBalls()

    mixBalls: function(indexStart) {
      // Go through all balls
      for (var i = indexStart, iLen = $scope.NUMBER_BALLS; i < iLen; i++)
      {
        this.swapBalls(i, getRandomInt(indexStart, iLen - 1));
      } // for all balls i
    }, // mixBalls()

    drawBall: function() {
      this.indexCurrentBall += 1;
      this.mixBalls(this.indexCurrentBall);
      this.balls[this.ordering[this.indexCurrentBall]].isDrawn = true;
      this.displayBallInfo(this.ordering[this.indexCurrentBall], $scope.ACTIONS.DRAW);
    }, // drawBall()

    swapMagicNumbers: function(a, b) {
      var tempValue = this.orderingMagicNumbers[a];
      this.orderingMagicNumbers[a] = this.orderingMagicNumbers[b];
      this.orderingMagicNumbers[b] = tempValue;
    }, // swapMagicNumbers()

    mixMagicNumbers: function(indexStart) {
      // Go through all magic numbers
      for (var i = indexStart, iLen = $scope.NUMBER_MAGIC_NUMBERS; i < iLen; i++)
      {
        this.swapMagicNumbers(i, getRandomInt(indexStart, iLen - 1));
      } // for all magic numbers i
    }, // mixMagicNumbers()

    drawMagic: function() {
      this.indexCurrentMagicNumber += 1;
      this.mixMagicNumbers(this.indexCurrentMagicNumber);
      // Mark magic number as drawn
      this.magicNumbers[this.orderingMagicNumbers[this.indexCurrentMagicNumber]].isDrawn = true;
      // Go through all balls ending in magic number
      for (var i = this.orderingMagicNumbers[this.indexCurrentMagicNumber] - 1, iLen = $scope.NUMBER_BALLS; i < iLen; i += 10)
      {
        // Skip to 10 if magic number is 0
        if (i == -1) continue;
        // Update current index of drawn
        this.indexCurrentBall += 1;
        // Mark ball as magic and drawn
        this.balls[i].isDrawn = true;
        this.balls[i].isMagic = true;
        // Delete from ball ordering
        this.ordering.splice(this.ordering.indexOf(i), 1);
        // Add to current index of ball ordering
        this.ordering.splice(this.indexCurrentBall, 0, i);
      } // for all balls ending in magic number i
      this.displayBallInfo(-1, $scope.ACTIONS.MAGIC);
    } // drawMagic()
  };


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
//Will return a number inside the given range, inclusive of both minimum and maximum
//i.e. if min=0, max=20, returns a number from 0-20
function getRandomInt(min, max) 
{
  return Math.floor(Math.random() * (max - min + 1)) + min;
} // getRandomInt()
