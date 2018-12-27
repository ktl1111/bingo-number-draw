var app = angular.module('bingo_web', []);

app.controller('controllerMain', function($scope) {
  // Constants
  $scope.GRID_ELEMENTS = {
    LETTERS: ['B', 'I', 'N', 'G', 'O'],
    NUMBERS: Array.apply(null, Array(15)).map(function(number, index) { return index; })
  };
  $scope.NUMBER_MAGIC_NUMBERS = 10;
  $scope.NUMBER_BALLS = $scope.GRID_ELEMENTS.LETTERS.length * $scope.GRID_ELEMENTS.NUMBERS.length;

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
          reading:        letter + ' - ' + number,
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
      order:   '',      
      reading: 'B  I  N  G  O'
    },

    // Methods
    displayBallInfo: function(indexBall, isFromDraw, isFromMagic) {
      // Check if from Magic button
      if (isFromMagic)
      {
        this.info.magic = 'Magic: '
          + this.magicNumbers
            .filter(function (magic) { return magic.isDrawn; })
            .map(function (magic) { return magic.number; })
            .join(', ');
        this.info.reading = this.orderingMagicNumbers[this.indexCurrentMagicNumber];
      } 
      else
      {
        this.info.reading = this.balls[indexBall].reading;
      } // isFromMagic

      this.info.order = ((this.indexCurrentBall < ($scope.NUMBER_BALLS - 1))
        ? ((this.balls[indexBall].isDrawn)
          ? 'Ball ' + ((isFromDraw)
            ? (this.indexCurrentBall + 1).toString()
            : (this.ordering.indexOf(indexBall) + 1).toString() + ' of ' + (this.indexCurrentBall + 1).toString()
          )
          : 'Not yet drawn'
        )
        : 'Last Ball'
      );
    },
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
        this.info.reading = 'B  I  N  G  O';
      } // if confirm()
    },
    swapBalls: function(a, b) {
      var tempValue = this.ordering[a];
      this.ordering[a] = this.ordering[b];
      this.ordering[b] = tempValue;
    },
    mixBalls: function(indexStart) {
      // Go through all balls
      for (var i = indexStart, iLen = $scope.NUMBER_BALLS; i < iLen; i++)
      {
        this.swapBalls(i, getRandomInt(indexStart, iLen - 1));
      } // for all balls i
    },
    drawBall: function() {
      this.indexCurrentBall += 1;
      this.mixBalls(this.indexCurrentBall);
      this.balls[this.ordering[this.indexCurrentBall]].isDrawn = true;
      this.displayBallInfo(this.ordering[this.indexCurrentBall], true, false);
    },

    swapMagicNumbers: function(a, b) {
      var tempValue = this.orderingMagicNumbers[a];
      this.orderingMagicNumbers[a] = this.orderingMagicNumbers[b];
      this.orderingMagicNumbers[b] = tempValue;
    },
    mixMagicNumbers: function(indexStart) {
      // Go through all magic numbers
      for (var i = indexStart, iLen = $scope.NUMBER_MAGIC_NUMBERS; i < iLen; i++)
      {
        this.swapMagicNumbers(i, getRandomInt(indexStart, iLen - 1));
      } // for all magic numbers i
    },
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
      this.displayBallInfo(this.ordering[this.indexCurrentBall], true, true);
    }
  };
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
