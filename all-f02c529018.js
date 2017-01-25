//init mathjax configuration
MathJax.Hub.Config({
   extensions: ["tex2jax.js"],
   jax: ["input/TeX", "output/CommonHTML", "output/SVG"],
   tex2jax: {
      inlineMath: [ ["\\(","\\)"] ],
      displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
      preview: "none",
      //ignoreClass: "scriptMath",
      processEscapes: true
   },
   TeX: {
      extensions: ["mhchem.js","color.js", "AMSmath.js","AMSsymbols.js","noErrors.js","noUndefined.js"]
   },
   SVG: {
      scale: 120,
      minScaleAdjust: 60
   },
   messageStyle: "none",
   skipStartupTypeset: true
});
MathJax.Hub.Configured();

//construct angularjs app and load dependencies
var mainApp = angular.module('mainApp',
    ['ngMessages',                     //display message with conditionally
       'ngResource',                   //call ajax in angular service
       'ngSanitize',                   //sanitize html string
       'ngAnimate',                   // CSS-based animations
       'monospaced.elastic',           //auto resize textarea
       'ui.bootstrap.datetimepicker',
       'dndLists',                     //drag and drop items
       'ngFileUpload',                 //upload file to server
       'ui.tinymce',                   //tinymce editor
       'infinite-scroll',              //scroll infinite
       'ui.bootstrap',                 //angular for bootstrap
       'angular-svg-round-progressbar', //Angular SVG round progressbar
       'FBAngular',                     //HTML5 fullscreen API
       'angularjs-crypto',             //encryption
       'chart.js',                      //draw chart
        '720kb.socialshare',             //social share
        'vcRecaptcha'                   //grecatcha
    ]);

//Because Laravel and AngularJS use the exact same data render tags,
// we can change the tags of AngularJS to accommodate both frameworks.
mainApp.config(['$interpolateProvider', '$locationProvider', function ($interpolateProvider, $locationProvider) {

    $interpolateProvider.startSymbol('<%');
    $interpolateProvider.endSymbol('%>');

    //use HTML5Mode for change/update url in app
    //Html5Mode require base. It can be set in head with <base href="/">.
    //However, MathJax can not display equation. Therefore, don't use it and must disable in requireBase
    //Because don't use <base ...>, in <a> tag has href, must be add target="_self"
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });

    //set datetimepicker use vi format for datetime
    moment.locale('vi');
}]);
mainApp.controller('accountCtrl', ['$scope', '$window', 'HeaderService', function($scope, $window, HeaderService){
    //This control use for account in right corner in header of each page
    var accountVm = this;

    /**
     * Log user out and go to welcome page
     */
    accountVm.logout = function () {
        HeaderService.logout(function successCallback() {
            $window.location.href = '/';
        }, function errorCallback() {
            $window.location.href = '/';
        });

    };


}]);
mainApp.controller('confirmCreateExamCtrl', ['$scope', '$uibModalInstance', 'vcRecaptchaService', 'requiredCaptcha', function($scope, $uibModalInstance, vcRecaptchaService, requiredCaptcha){
    var confirmCreateExamVm = this; //view's model for detail controller
    confirmCreateExamVm.requiredCaptcha = requiredCaptcha;
    confirmCreateExamVm.recaptchaResponse = null;
    confirmCreateExamVm.widgetId = null;

    confirmCreateExamVm.createReCaptcha = function (widgetId) {
        confirmCreateExamVm.message = '';
        confirmCreateExamVm.widgetId = widgetId;
    };

    confirmCreateExamVm.successReCaptcha = function () {
        confirmCreateExamVm.message = '';
    };

    confirmCreateExamVm.resetReCaptcha = function () {
        confirmCreateExamVm.message = '';
        confirmCreateExamVm.recaptchaResponse = null;
        vcRecaptchaService.reload(confirmCreateExamVm.widgetId);
    };

    confirmCreateExamVm.cancel = function () {
        $uibModalInstance.close({
            success: false
        });
    };

    confirmCreateExamVm.agree = function () {
        if (confirmCreateExamVm.requiredCaptcha && confirmCreateExamVm.recaptchaResponse == null) {
            confirmCreateExamVm.message = 'Vui lòng xác nhận captcha';
            return;
        }

        $uibModalInstance.close({
            success: true,
            recaptchaResponse: confirmCreateExamVm.recaptchaResponse
        });
    };
}]);
mainApp.controller('welcomeCtrl', ['$scope', '$timeout', '$window', '$uibModal', function($scope, $timeout, $window, $uibModal){

    var welcomeVm = this;
    welcomeVm.createIcon = false;
    welcomeVm.demoIcon = false;
    welcomeVm.loggedIn = false;
    welcomeVm.activated = false;
    welcomeVm.requiredCaptcha = false;

    welcomeVm.init = function (data) {
        console.log(data);
        welcomeVm.loggedIn = data.loggedIn;
        welcomeVm.activated = data.activated;
        welcomeVm.requiredCaptcha = data.requiredCaptcha;
    };

    /**
     * search exam to do if query is valid
     * @param isValid
     */
    welcomeVm.searchExam = function(isValid) {
        if (isValid) {
            var query = welcomeVm.query;
            //redirect to search page with query
            $window.location.href = '/search?q=' + query;
        }
    };

    welcomeVm.createExam = function() {
        if (!welcomeVm.loggedIn) {
            welcomeVm.createMessage = 'Bạn chưa đăng nhập';
            return;
        }

        if (!welcomeVm.activated) {
            welcomeVm.createMessage = 'Tài khoản chưa được kích hoạt';
            return;
        }

        var confirmCreateExamModalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'confirmCreateExamModal.html',
            controller: 'confirmCreateExamCtrl',
            controllerAs: 'confirmCreateExamVm',
            keyboard: true,
            resolve: {
                requiredCaptcha: function () {
                   return welcomeVm.requiredCaptcha;
                }
            }
        });

        confirmCreateExamModalInstance.result.then(function (result){
            if (result.success) {
                welcomeVm.createIcon = true;
                if (welcomeVm.requiredCaptcha) {
                    $window.location.href = '/u/exam/create?g-recaptcha-response=' + result.recaptchaResponse;
                } else {
                    $window.location.href = '/u/exam/create';
                }
            }
        });

    };

    /**
     * reset all input search error
     * @param form
     */
    welcomeVm.reset = function(form) {
        //reset form
        form.$setPristine();
        form.$setUntouched();
    };

}]);
mainApp.directive('animatedIfEnterCallback', ['$animate', function ($animate) {
    return {
        restrict: 'A',
        scope: {
            'animatedIfEnterCallback': '&'
        },
        link: function(scope, elem, attrs) {
            scope.animatedIfEnterCallback = scope.animatedIfEnterCallback || (function() {});
            $animate.on('enter', elem, function callback(element, phase){
                if (phase == 'close') {
                    scope.animatedIfEnterCallback();
                }
            });
        }
    };
}]);
mainApp.directive('birthdate', function(){
   return {
       require: 'ngModel',
       link: function(scope, elm, attrs, ctrl) {

           scope.$watchCollection(attrs.birthdate, function(birth){
               if (angular.isUndefined(birth)
                   || angular.isUndefined(birth.day)
                   || angular.isUndefined(birth.month)
                   || angular.isUndefined(birth.year)) {
                   return ;
               }

               var d = parseInt(birth.day);
               var m = parseInt(birth.month) - 1; //month count from 0 (javascript getMonth count from 0)
               var y = parseInt(birth.year);
               var currentYear = new Date().getFullYear();

               var date = new Date(y, m, d);

               if (date.getFullYear() == y && date.getMonth() == m && date.getDate() == d
                   && y > 1900 && y <= currentYear) {
                   ctrl.$setValidity('birthdate', true);
                   ctrl.$setViewValue(y + '-' + (m + 1) + '-' + d);
               } else {
                   ctrl.$setValidity('birthdate', false);
               }
           });
       }
   }
});

mainApp.directive('compareTo', function(){
    return {
        require: 'ngModel',
        scope: {
            otherModelValue: '=compareTo'
        },
        link: function(scope, elm, attrs, ctrl) {
            ctrl.$validators.compareTo = function(modelValue) {
                return modelValue == scope.otherModelValue;
            }
        }

    };

});
mainApp.directive('convertToNumber', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function(val) {
                return parseInt(val, 10);
            });
            ngModel.$formatters.push(function(val) {
                return '' + val;
            });
        }
    };
});
//mathtype editor
mainApp.directive('editableEquation', function(){
    var history = [];
    var currentHistoryIdx = -1;

    // helper functions
    var helper = {
        // highlight: regex replacer function
        init: function(el) {
            history[0] = {
                'content': el.innerHTML,
                'selected': {
                    'start': el.innerHTML.length,
                    'end': el.innerHTML.length
                }
            };
            currentHistoryIdx = 0;
        },

        // keyIsAvailable
        keyIsAvailable: function(e){
            var numberKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            var charKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
                'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
                'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            var specialKeys = [';', '=', ',', '-', '.', '/', '`', '[', '\\', ']',
                '\'', '<', '>', '?', ':', '"', '|', '{', '}', '_', '+', '~', '!',
                '@', '#', '$', '%', '^', '&', '*', '(', ')'];

            var valid =
                (numberKeys.indexOf(e.key) != -1)
                || e.key == ' '
                || e.key == 'Delete'
                || e.key == 'Del' //IE
                || e.key == 'Backspace'
                || (charKeys.indexOf(e.key) != -1)
                || (specialKeys.indexOf(e.key) != -1);

            return (valid && e.key != 'Control' && e.key != 'Alt')
                || (e.key == 'Paste');
        },

        // keyIsDelete
        keyIsDelete: function(e){
            return e.key == 'Backspace' || e.key == 'Delete' || e.key == 'Del';
        },

        // saveSelection
        saveSelection: function(containerEl) {
            var charIndex = 0, start = 0, end = 0, foundStart = false, stop = {};
            var sel = rangy.getSelection(), range;

            function traverseTextNodes(node, range) {
                if (node.nodeType == 3) {
                    if (!foundStart && node == range.startContainer) {
                        start = charIndex + range.startOffset;
                        foundStart = true;
                    }
                    if (foundStart && node == range.endContainer) {
                        end = charIndex + range.endOffset;
                        throw stop;
                    }
                    charIndex += node.length;
                } else {
                    for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                        traverseTextNodes(node.childNodes[i], range);
                    }
                }
            }

            if (sel.rangeCount) {
                try {
                    traverseTextNodes(containerEl, sel.getRangeAt(0));
                } catch (ex) {
                    if (ex != stop) {
                        throw ex;
                    }
                }
            }

            return {
                start: start,
                end: end
            };
        },

        // restoreSelection
        restoreSelection: function(containerEl, savedSel) {
            var charIndex = 0, range = rangy.createRange(), foundStart = false, stop = {};
            range.collapseToPoint(containerEl, 0);

            function traverseTextNodes(node) {
                if (node.nodeType == 3) {
                    var nextCharIndex = charIndex + node.length;
                    if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                        range.setStart(node, savedSel.start - charIndex);
                        foundStart = true;
                    }
                    if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                        range.setEnd(node, savedSel.end - charIndex);
                        throw stop;
                    }
                    charIndex = nextCharIndex;
                } else {
                    for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                        traverseTextNodes(node.childNodes[i]);
                    }
                }
            }

            try {
                traverseTextNodes(containerEl);
            } catch (ex) {
                if (ex == stop) {
                    rangy.getSelection().setSingleRange(range);
                } else {
                    throw ex;
                }
            }
        },

        // formatText
        formatText: function (el) {
            var savedSel = helper.saveSelection(el);

            var historyData = {};
            historyData['content'] = el.innerHTML;

            el.innerHTML = el.innerHTML.replace(/<span[\s\S]*?>([\s\S]*?)<\/span>/g,"$1");
            el.innerHTML = el.innerHTML.replace(/<font[\s\S]*?>([\s\S]*?)<\/font>/g,"$1");
            el.innerHTML = el.innerHTML.replace(/<b>([\s\S]*?)<\/b>/g,"$1");
            el.innerHTML = el.innerHTML.replace(/\\(?:[^a-zA-Z]|[a-zA-Z]+[*=']?)/g, function(str){
                return '<span class="cq-math-texCommand">' + str + '</span>';
            });

            //save history
            historyData['selected'] = savedSel;
            if (currentHistoryIdx > 50) { //limit memory to save (deep undo)
                history.shift();
            } else {
                currentHistoryIdx++;
            }
            history[currentHistoryIdx] = historyData;

            // Restore the original selection
            helper.restoreSelection(el, savedSel);
        },

        undoText: function(el) {
            if (currentHistoryIdx > 0) {
                currentHistoryIdx--;
                el.innerHTML = history[currentHistoryIdx].content;
                helper.restoreSelection(el, history[currentHistoryIdx].selected);
            }
        },

        redoText: function(el) {
            if (typeof history[currentHistoryIdx+1] !== 'undefined') {
                currentHistoryIdx++;
                el.innerHTML = history[currentHistoryIdx].content;
                helper.restoreSelection(el, history[currentHistoryIdx].selected);
            }
        }

    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            equation: '='
        },
        link: function(scope, elm, attrs, ctrl){
            if (!ctrl) return; // do nothing if no ng-model

            // Specify how UI should be updated, run once when init
            ctrl.$render = function() {
                var html = ctrl.$viewValue;
                if (html) {
                    elm.html(html);
                    helper.init(elm[0]);
                }
            };

            // Listen for change events to enable binding
            elm.on('blur', function() {
                scope.$evalAsync(read);
            });

            var currentCaret = null;
            var cursorMoving = false;

            elm.on('keyup', function(e){
                // format if key is valid
                if(helper.keyIsAvailable(e)){
                    cursorMoving = false;
                    helper.formatText(elm[0]);
                } else if (e.key == 'Undo') { //ctrl + Z
                    cursorMoving = false;
                    //restore old html
                    helper.undoText(elm[0]);
                } else if (e.key == 'Redo') { //ctrl + shift + Z
                    cursorMoving = false;
                    helper.redoText(elm[0]);
                } else if (e.key == 'Enter') { //enter key
                    cursorMoving = false;
                    currentHistoryIdx++;
                    history[currentHistoryIdx] = {
                        content: elm[0].innerHTML,
                        selected: currentCaret
                    };
                } else if (e.key == 'ArrowLeft' || e.key == 'ArrowUp' || e.key == 'ArrowRight' || e.key == 'ArrowDown'
                    || e.key == 'Left' || e.key == 'Up' || e.key == 'Right' || e.key == 'Down'){ //left right up down key
                    //add more element to history array. When user undo, it will go back to position which content changed last (not undo immediately)
                    currentCaret = helper.saveSelection(elm[0]);
                    if (cursorMoving == false) {
                        cursorMoving = true;
                        currentHistoryIdx++;
                        history[currentHistoryIdx] = {
                            content: elm[0].innerHTML,
                            selected: currentCaret
                        };
                    }
                }

                // delete blank html elements
                if(helper.keyIsDelete && elm.text()=="") {
                    elm.html("");
                }
                scope.$evalAsync(read); //update model
            });

            elm.on('change', function(e){
                helper.formatText(elm[0]);
                scope.$evalAsync(read); //update model
            });

            // load init value to DOM
            ctrl.$render();

            // Write data to the model
            function read() {
                var text = elm.text();
                ctrl.$setViewValue(text);
            }
        }
    }
});

mainApp.directive('editableGrade', function(){
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            grade: '='
        },
        link: function(scope, elm, attrs, ctrl) {
            if (!ctrl) return; // do nothing if no ng-model

            // Specify how UI should be updated
            ctrl.$render = function() {
                elm.html(parseFloat(ctrl.$viewValue));
            };

            // Listen for change events to enable binding
            elm.on('blur', function() {
                scope.$evalAsync(read);
            });

            elm.on('keydown', function(e) {
                if (e.key == 'Enter') {
                    $(this).closest('li').find('input').first().focus();
                    e.preventDefault();
                    return;
                }

                var numberKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                //keyCode is valid if it is . or 1-9 or backspace or delete or tab or esc or <- or ->
                if ((e.key != 'Backspace')
                    && (e.key != 'Tab')
                    && (e.key != 'Escape')
                    && (e.key != 'End')
                    && (e.key != 'Home')
                    && (e.key != 'ArrowLeft')
                    && (e.key != 'ArrowRight')
                    && (e.key != 'Delete')
                    && (e.key != '.')
                    && (e.key != 'Esc') //IE
                    && (e.key != 'Left') //IE
                    && (e.key != 'Right') //IE
                    && (e.key != 'Del') //IE
                    && (numberKeys.indexOf(e.key) == -1)) {
                    e.preventDefault();
                }
            });

            // initialize get value from DOM
            //read();

            // load init value to DOM
            ctrl.$render();

            // Write data to the model
            function read() {
                var html = elm.html();
                var newGrade;
                if (isNaN(html)) {
                    newGrade = scope.grade; //recover old value
                } else {
                    newGrade = parseFloat(html);
                    newGrade = Math.round(newGrade * 100) / 100;
                    if (newGrade < 0 || newGrade >= 1000) {
                        newGrade = scope.grade; //recover old value
                    }
                }
                ctrl.$setViewValue(newGrade);
                ctrl.$render();
            }
        }
    }

});
mainApp.directive('editableTimer', function() {
   return {
       restrict: 'A',
       require: 'ngModel',
       scope: {
           timer: '='
       },
       link: function(scope, elm, attrs, ctrl) {
           if (!ctrl) return; // do nothing if no ng-model

           // Specify how UI should be updated
           ctrl.$render = function() {
               //format model in seconds for display
               var quesTimer = parseInt(ctrl.$viewValue);
               if (isNaN(quesTimer)) {
                   elm.html('');
                   return;
               }

               var hour = Math.floor(quesTimer / 3600);
               var minute_second = quesTimer % 3600;
               var minute = Math.floor(minute_second / 60);
               var second = minute_second % 60;
               var transformedViewValue = '';
               if (hour > 0) {
                   transformedViewValue += hour + 'h';
               }

               if (minute > 0 || (hour > 0 && second > 0)) {
                   transformedViewValue += minute + "'";
               }

               if (second > 0 || (hour == 0 && minute == 0)) {
                   transformedViewValue += second + '"';
               }

               elm.html(transformedViewValue);
           };

           // Listen for change events to enable binding
           elm.on('blur', function() {
               scope.$evalAsync(read);
           });

           elm.on('keydown', function(e) {
               if (e.key == 'Enter') {
                   $(this).closest('li').find('input').first().focus();
                   e.preventDefault();
                   return;
               }

               var numberKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
               //keyCode is valid if it is 0-9 h ' " or backspace or delete or tab or esc or <- or ->
               if ((e.key != 'Backspace')
                   && (e.key != 'Tab')
                   && (e.key != 'Escape')
                   && (e.key != 'End')
                   && (e.key != 'Home')
                   && (e.key != 'ArrowLeft')
                   && (e.key != 'ArrowRight')
                   && (e.key != 'Delete')
                   && (e.key != 'h')
                   && (e.key != '\'')
                   && (e.key != '\"')
                   && (e.key != 'Esc') //IE
                   && (e.key != 'Left') //IE
                   && (e.key != 'Right') //IE
                   && (e.key != 'Del') //IE
                   && (numberKeys.indexOf(e.key) == -1)) {
                   e.preventDefault();
               }
           });

           // initialize get value from DOM
           //read();

           // load init value to DOM
           ctrl.$render();

           // Write data to the model
           function read() {
               var html = elm.html();
               var patternTimer = /(\d{1,2}h)?(\d{1,3}')?(\d{1,3}")?/i;
               var parsedTimer = patternTimer.exec(html);
               var newTimer = 0;
               if (parsedTimer == null || parsedTimer[0] != parsedTimer['input']) {
                   newTimer = scope.timer; //recover old value
               } else {
                   //convert to seconds
                   if (angular.isDefined(parsedTimer[1])) {
                       newTimer += parseInt(parsedTimer[1]) * 3600;
                   }

                   if (angular.isDefined(parsedTimer[2])) {
                       newTimer += parseInt(parsedTimer[2]) * 60;
                   }

                   if (angular.isDefined(parsedTimer[3])) {
                       if (angular.isDefined(parsedTimer[1]) && angular.isUndefined(parsedTimer[2])) {
                           //there hour and second but not minute --> is not valid
                           newTimer = scope.timer;
                       } else {
                           newTimer += parseInt(parsedTimer[3]);
                       }
                   }
               }

               //change model
               ctrl.$setViewValue(newTimer);

               //change html
               ctrl.$render();
           }
       }
   }
});
/**
 * "name": "angular-flippy",
 * "version": "2.0.5",
 * "description": "AngularJS directive implementation with a CSS3 flip animation",
 * "homepage": "https://github.com/zwacky/angular-flippy",
 *
 * handles the behaviour of flipping card.
 *
 */
mainApp.directive('flippy', function() {
    return {
        restrict: 'E',
        scope: {
            flip: '=',
            flipBack: '=',
            duration: '@',
            timingFunction: '@'
        },
        link: function($scope, $elem, $attrs) {
            const CUSTOM_PREFIX = 'custom:';
            const state = {
                flipped: false
            };
            const options = {
                duration: 400,
                timingFunction: 'ease-in-out'
            };

            // assign new options
            angular.forEach(['duration', 'timingFunction'], function(item) {
                options[item] = ($scope.item) ? $scope.item : options[item];
            });

            angular.forEach({flip: flip, flipBack: flipBack}, function(flipFunc, evt) {
                angular.forEach($scope[evt], function(eventName) {
                    if (eventName.indexOf(CUSTOM_PREFIX) === -1) {
                        // directly register event listener to avoid having to start off angular's digest cycle
                        angular.element($elem)[0].addEventListener(eventName, flipFunc);
                    } else {
                        $scope.$on(eventName.substr(CUSTOM_PREFIX.length), flipFunc);
                    }
                });
            });

            // set flip duration
            angular.forEach(['flippy-front', 'flippy-back'], function(name) {
                const el = $elem.find(name);
                if (el.length == 1) {
                    angular.forEach(['', '-ms-', '-webkit-'], function(prefix) {
                        angular.element(el[0]).css(prefix + 'transition', 'all ' + options.duration/1000 + 's ' + options.timingFunction);
                    });
                }
            });

            /**
             * flips the card.
             * will be ignored, if the state is already the same as the target state.
             *
             */
            //function _flip(isBack = false) {
            function _flip() {
                var isBack = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

                if ((!isBack && !state.flipped) || (isBack && state.flipped)) {
                    // to avoid toggling it right back if flip-back is the same event
                    setTimeout(function () {
                        $elem.toggleClass('flipped');
                        state.flipped = !state.flipped;
                    }, 0);
                }
            }

            function flip() {
                _flip();
            }

            function flipBack() {
                _flip(true);
            }
        }
    };
});

mainApp.directive('gradeDistribution', function(){
    return {
        restrict: 'A',
        link: function(scope, elm, attrs) {
            elm.on('contextmenu', function(e) {
                e.preventDefault();
            });
        }
    }

});
mainApp.directive('keypressEvents', ['$document', '$rootScope', function ($document, $rootScope) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            $document.bind('keydown', function (e) {
                console.log('keydown');
                console.log(e);
                $rootScope.$broadcast('keydown', e);
            });

            $document.bind('keyup', function (e) {
                console.log('keyup');
                console.log(e);
                $rootScope.$broadcast('keyup', e);
            });
        }
    };
}]);
mainApp.directive('linkDisabled', function() {
    return {
        restrict: 'A',
        scope: {
            linkDisabled: '=linkDisabled'
        },
        link: function(scope, element, attrs) {
            element.bind('click', function(event) {
                if(scope.linkDisabled) {
                    event.preventDefault();
                }
            });
        }
    };
});
mainApp.directive("mathjaxBind", function() {
    //only use in mathtype editor becacause it depends on vm (mathtype controller) with blockDisplay variable
    return {
        restrict: "A",
        controller: ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {
            $scope.$watch($attrs.mathjaxBind, function(value) {
                var displayType = ($scope.mathtypeVm.blockDisplay) ? "'math/tex; mode=display'" : "'math/tex'";
                var $script = angular.element("<script type=" + displayType + " >")
                    .html(value == undefined ? "" : value);
                $element.html("");
                $element.append($script);
                MathJax.Hub.Queue(["Reprocess", MathJax.Hub, $element[0]]);
            });
        }]
    };
});
//Ref https://github.com/nico-val/ngClipboard/blob/master/README.md
mainApp.factory('ngClipboard', ['$compile', '$rootScope', '$document', function($compile, $rootScope, $document) {
    return {
        toClipboard: function(element){
            var copyElement = angular.element('<span id="ngClipboardCopyId">'+element+'</span>');
            var body = $document.find('body').eq(0);
            body.append($compile(copyElement)($rootScope));

            var ngClipboardElement = angular.element(document.getElementById('ngClipboardCopyId'));
            // console.log(ngClipboardElement);
            var range = document.createRange();

            range.selectNode(ngClipboardElement[0]);

            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);

            var successful = document.execCommand('copy');
            //
            // var msg = successful ? 'successful' : 'unsuccessful';
            // console.log('Copying text command was ' + msg);
            window.getSelection().removeAllRanges();

            copyElement.remove();
        }
    }
}])
.directive('ngCopyable', function() {
    return {
        restrict: 'A',
        link:link
    };
    function link(scope, element, attrs) {
        element.bind('click',function(){

            var range = document.createRange();
            range.selectNode(element[0]);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            // var successful = document.execCommand('copy');
            //
            // var msg = successful ? 'successful' : 'unsuccessful';
            // console.log('Copying text command was ' + msg);
            window.getSelection().removeAllRanges();
        });
    }

});
mainApp.directive('ngRepeatFinished', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            if (scope.$last) {
                //if item last in ng-repeat is render
                $timeout(function(){
                    scope.$eval(attrs.ngRepeatFinished);
                }, 0);
            }
        }
    };
}]);
mainApp.directive('onlyDigits', function(){
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: true,
        link: function(scope, elm, attrs, ctrl) {
            ctrl.$parsers.push(function(viewValue){
                if (angular.isUndefined(viewValue) || viewValue == null) return null;

                if (typeof viewValue == 'number') {
                    viewValue = viewValue.toString();
                }

                var transformedInput = viewValue.replace(/[^0-9]/g,'').replace(/^0+/g,'');
                if (transformedInput != viewValue) {
                    if (transformedInput == '') transformedInput = '0';
                    ctrl.$setViewValue(parseInt(transformedInput));
                    ctrl.$render();
                }

                return parseInt(transformedInput);
            });

            elm.bind('keydown', function (e) {
                var numberKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if ((e.key != 'Backspace')    //backspace
                    && (e.key != 'Tab') //tab
                    && (e.key != 'ArrowLeft') //left
                    && (e.key != 'ArrowRight') //right
                    && (e.key != 'Delete') //delete
                    && (e.key != 'Home') //home
                    && (e.key != 'End') //end
                    && (e.key != 'Left') //IE
                    && (e.key != 'Right') //IE
                    && (numberKeys.indexOf(e.key) == -1)) {
                    e.preventDefault();
                }
            });
        }

    };
});
mainApp.filter('parseDate', function() {
    return function(dateStr) {
        //notes that dateStr in format 'Y-m-d H:i:s'
        //so it not suitable for Date type in JS (depend on browser)
        // return new Date(dateStr);
        if (dateStr == null) return '';

        return moment(dateStr, 'YYYY-MM-DD H:m:s').toDate();
    };
});
mainApp.directive('preventSpace', function(){
    return {
        restrict: 'A',
        scope: true,
        link: function(scope, elm, attrs) {
            elm.on('keydown', function(e) {
                if (e.key == ' ') {
                    e.preventDefault();
                }
            });
        }
    }
});
mainApp.directive('processMathjax', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            if (scope.$last) {
                //if item last in ng-repeat is render
                $timeout(function(){
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
                }, 0);
            }
        }
    };
}]);
mainApp.directive('refreshMathjax', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            //run after rendering
            $timeout(function(){
                MathJax.Hub.Queue(['Typeset', MathJax.Hub], function () {
                    if (attrs.refreshMathjax) {
                        scope.$eval(attrs.refreshMathjax);
                    }
                });
            });
        }
    };
}]);
mainApp.directive('scrollDrag', function(){
    return {
        restrict: 'A',
        scope: true,
        link: function(scope, elm, attrs) {
            //Notes: not use scope to get variable stopScroll in controller, because timeout function will check and not get this one
            console.log('init scroll');
            elm.on("drag", function (e) {
                console.log('begin scroll');
                scope.detailVm.stopScroll = true;
                if (e.originalEvent.clientY < 150) {
                    scope.detailVm.stopScroll = false;
                    scroll(-1);
                }

                if (e.originalEvent.clientY > ($(window).height() - 150)) {
                    scope.detailVm.stopScroll = false;
                    scroll(1);
                }
            });

            elm.on("dragend", function (e) {
                console.log('end scroll');
                scope.detailVm.stopScroll = true;
            });

            var scroll = function (step) {
                console.log('scrolling');
                var scrollY = $(window).scrollTop();
                $(window).scrollTop(scrollY + step);
                if (!scope.detailVm.stopScroll) {
                    setTimeout(function () { scroll(step) }, 20);
                }
            };
        }
    }
});
mainApp.directive('selectOnClick', ['$window', function ($window) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function () {
                if (!$window.getSelection().toString()) {
                    // Required for mobile Safari
                    this.setSelectionRange(0, this.value.length)
                }
            });
        }
    };
}]);
//references: http://jsfiddle.net/manishpatil/2fahpk7s/
mainApp.directive('starRating', function () {
    return {
        scope: {
            rating: '=',
            maxRating: '@',
            readOnly: '@',
            size: '@',
            click: "&",
            mouseHover: "&",
            mouseLeave: "&"
        },
        restrict: 'AE',
        template:
            "<div class='d-inline-block' style='cursor:pointer;' \
                    ng-repeat='idx in maxRatings track by $index'> \
                    <div ng-click='isolatedClick($index + 1)' \
                    ng-mouseenter='isolatedMouseHover($index + 1)' \
                    ng-mouseleave='isolatedMouseLeave($index + 1)'>\
                        <i class='fa fa-star-o' ng-class='<%size%>' ng-if='(hoverValue + rating) <= $index' aria-hidden='true'></i>\
                        <i class='fa fa-star' ng-class='<%size%>' ng-if='(hoverValue + rating) > $index' aria-hidden='true'></i>\
                    </div>\
            </div>",
        compile: function (element, attrs) {
            if (!attrs.maxRating || (Number(attrs.maxRating) <= 0)) {
                attrs.maxRating = '5';
            }
        },
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            $scope.maxRatings = [];

            for (var i = 1; i <= $scope.maxRating; i++) {
                $scope.maxRatings.push({});
            }

            $scope.hoverValue = 0;
            $scope.beginHover = true;

            $scope.isolatedClick = function (param) {
                if ($scope.readOnly == 'true') return;

                //$scope.beginHover = true;
                $scope.rating = param;
                $scope.reserveRating = param;
                $scope.hoverValue = 0;
                $scope.click({
                    param: param
                });
            };

            $scope.isolatedMouseHover = function (param) {
                if ($scope.readOnly == 'true') return;

                if ($scope.beginHover) {
                    $scope.reserveRating = $scope.rating;
                    $scope.beginHover = false;
                }

                $scope.rating = 0;
                $scope.hoverValue = param;
                $scope.mouseHover({
                    param: param
                });
            };

            $scope.isolatedMouseLeave = function (param) {
                if ($scope.readOnly == 'true') return;

                $scope.beginHover = true;
                $scope.rating = $scope.reserveRating;
                $scope.hoverValue = 0;
                $scope.mouseLeave({
                    param: param
                });
            };
        }]
    };
});
mainApp.directive('tooltip', function(){
    return {
        restrict: 'A',
        scope: true,
        link: function(scope, element, attrs){
            $(element).hover(function(){
                // on mouseenter
                $(this).tooltip('dispose'); //if not have, error "Tooltip is transitioning" will be happen
                $(this).tooltip('show');
            }, function(){
                // on mouseleave
                $(this).tooltip('dispose'); //if not have, error "Tooltip is transitioning" will be happen
                $(this).tooltip('hide');
            });

            element.bind("$destroy",function(){
                $(this).tooltip('dispose');
            });
        }
    };
});
mainApp.filter('currency', ['$filter', function ($filter) {
    return function(input) {
        input = parseFloat(input);

        if(input % 1 === 0) {
            input = input.toFixed(0);
        }
        else {
            input = input.toFixed(2);
        }

        return input.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
}]);
// html filter (render text as html)
mainApp.filter('html', ['$sce', function ($sce) {
    return function(text) {
        return $sce.trustAsHtml(text);
    };
}]);

// Usage:
//     <span ng-bind-html="yourDataValue | html"></span>
mainApp.directive('preventEnter', function(){
    return {
        restrict: 'A',
        scope: true,
        link: function(scope, elm, attrs) {
            elm.on('keydown', function(e) {
                if (e.key == 'Enter') {
                    e.preventDefault();
                }
            });
        }
    }

});
//sparkalow/angular-truncate
//a filter for Angularjs to truncate text strings to a set number of characters or words and add ellipses when needed.
mainApp.filter('characters', function () {
    return function (input, chars, breakOnWord) {
        if (isNaN(chars)) return input;
        if (chars <= 0) return '';
        if (input && input.length > chars) {
            input = input.substring(0, chars);

            if (!breakOnWord) {
                var lastspace = input.lastIndexOf(' ');
                //get last space
                if (lastspace !== -1) {
                    input = input.substr(0, lastspace);
                }
            }else{
                while(input.charAt(input.length-1) === ' '){
                    input = input.substr(0, input.length -1);
                }
            }
            return input + '…';
        }
        return input;
    };
});
mainApp.filter('splitcharacters', function() {
    return function (input, chars) {
        if (isNaN(chars)) return input;
        if (chars <= 0) return '';
        if (input && input.length > chars) {
            var prefix = input.substring(0, chars/2);
            var postfix = input.substring(input.length-chars/2, input.length);
            return prefix + '...' + postfix;
        }
        return input;
    };
});

mainApp.filter('words', function () {
    return function (input, words) {
        if (isNaN(words)) return input;
        if (words <= 0) return '';
        if (input) {
            var inputWords = input.split(/\s+/);
            if (inputWords.length > words) {
                input = inputWords.slice(0, words).join(' ') + '…';
            }
        }
        return input;
    };
});
mainApp.factory('AnswerService', ['$resource', function($resource){
    return $resource('/u/exam/:examId/question/:questionId/answer/:answerId', {examId: '@examId', questionId: '@questionId', answerId: '@answerId'},{
        update: {method: 'PUT'},
        updatePosition: {
            method: 'PUT',
            url:'/u/exam/:examId/question/:questionId/answer/position',
            params: {examId: '@examId', questionId:'@questionId'}
        },
        updateCorrectAnswer: {
            method: 'PUT',
            url:'/u/exam/:examId/question/:questionId/answer/:answerId/correct',
            params: {examId: '@examId', questionId:'@questionId', answerId: '@answerId'}
        }
    });
}]);
mainApp.factory('CertificateService', ['$resource', function($resource){
    return $resource('/u/exam/:id/dashboard', {id: '@id'}, {
        print: {
            method: 'GET',
            url:'/u/exam/:id/dashboard/certificate-print',
            params: {id:'@id'}
        }
    });
}]);
mainApp.factory('CoinService', ['$resource', function($resource){
    return $resource('/u/coin', null, {
        verifyPassword: {
            method: 'POST',
            url: '/u/coin/withdraw/verify/password'
        },
        verifyCode: {
            method: 'POST',
            url: '/u/coin/withdraw/verify/code'
        },
        withdraw: {
            method: 'POST',
            url: '/u/coin/withdraw/do'
        },
        cancelWithdraw: {
            method: 'POST',
            url: '/u/coin/withdraw/cancel'
        },
        loadTransactions: {
            method: 'GET',
            url: '/u/coin/transaction-history?start=:start&end=:end&page=:page',
            params: {start:'@start', end: '@end', page: '@page'},
            cancellable: true
        },
        loadVoucherList: {
            method: 'GET',
            url: '/u/coin/voucher/list',
            cancellable: true
        },
        verifyPasswordVoucher: {
            method: 'POST',
            url: '/u/coin/voucher/verify/password'
        },
        verifyCodeWithCreateVoucher: {
            method: 'POST',
            url: '/u/coin/voucher/verify/code/create'
        },
        activateVoucher: {
            method: 'POST',
            url: '/u/coin/voucher/activate'
        },
        doAtmBankPayment: {
            method: 'POST',
            url: '/u/coin/topup/atm-banking'
        },
        doIBankPayment: {
            method: 'POST',
            url: '/u/coin/topup/internet-banking'
        },
        doCreditCardPayment: {
            method: 'POST',
            url: '/u/coin/topup/credit-card'
        },
        doScratchcardPayment: {
            method: 'POST',
            url: '/u/coin/topup/scratchcard'
        }

    });
}]);
mainApp.factory('CommentService', ['$resource', function($resource){
    return $resource('/u/comment', null, {
        send: {
            method: 'POST',
            url: '/u/comment'
        }
    });
}]);
mainApp.factory('DashboardService', ['$resource', function($resource){
    return $resource('/u/exam/:id/dashboard', {id: '@id'}, {
        loadQuestion: {
            method: 'GET',
            url:'/u/exam/:id/dashboard/questions',
            params: {id:'@id'}
        },
        loadLeaderBoard: {
            method: 'GET',
            url:'/u/exam/:id/dashboard/leader-board/load',
            params: {id: '@id'},
            cancellable: true
        },
        loadMoreStudent: {
            method: 'GET',
            url: '/u/exam/:id/dashboard/leader-board/more?page=:page',
            params: {id: '@id', page: '@page'}
        },
        helpExamAgain: {
            method: 'GET',
            url:'/u/exam/:examId/help/:type',
            params: {examId: '@examId', type: '@type'},
            cancellable: true
        },
        prepareAnswer: {
            method: 'GET',
            url: '/u/exam/:id/dashboard/prepare-answers',
            params: {id: '@id'}
        },
        synchronizeExam: {
            method: 'GET',
            url: '/u/exam/:id/dashboard/synchronize-exam',
            params: {id: '@id'}
        }
    });
}]);
mainApp.service('displayHtmlService', ['$sce', function($sce){
    this.renderHtml = function(description){
        if (description == null) {
            return '';
        }

        return  $sce.trustAsHtml(description);
    };
}]);
mainApp.factory('ExamService', ['$resource', function($resource){
    return $resource('/u/exam/:id', {id: '@id'}, {
        update: {method: 'PUT'},
        getSettings: {
            method: 'GET',
            url:'/u/exam/:id/settings',
            params: {id:'@id'}
        },
        tryToDoExam: {
            method: 'GET',
            url:'/u/exam/:id/try',
            params: {id:'@id'}
        }
    });
}]);
mainApp.factory('HeaderService', ['$resource', function($resource){
    return $resource('/', null,{
        logout: {
            method: 'POST',
            url:'/logout'
        }
    });
}]);

mainApp.factory('HomeService', ['$resource', function($resource){
    return $resource('/u/home/0', null, {
        loadCreation: {
            method: 'GET',
            url: '/u/home/creation/load?page=:page',
            params: {page: '@page'},
            cancellable: true
        },
        searchCreation: {
            method: 'GET',
            url: '/u/home/creation/search?query=:query&type=:type&page=:page',
            params: {query: '@query', type: '@type', page: '@page'},
            cancellable: true
        },
        loadAction: {
            method: 'GET',
            url: '/u/home/action/load?page=:page',
            params: {page: '@page'},
            cancellable: true
        },
        searchAction: {
            method: 'GET',
            url: '/u/home/action/search?query=:query&type=:type&page=:page',
            params: {query: '@query', type: '@type', page: '@page'},
            cancellable: true
        },
        loadExamsInMonth: {
            method: 'GET',
            url: '/u/home/exams/:month/:year',
            params: {month: '@month', year: '@year'},
            cancellable: true
        },
        deleteExam: {
            method: 'POST',
            url: '/u/home/exam/:id/delete',
            params: {id: '@id'}
        }
    });
}]);
mainApp.factory('ImageService', ['$resource', function($resource){
    return $resource('/u/image/exam/:examId', {examId: '@examId'},{
        update: { method: 'PUT'}
    });
}]);

mainApp.factory('InformationService', ['$resource', function($resource){
    return $resource('/exam/:id/information', {id: '@id'}, {
        socialCount: {
            method: 'GET',
            url:'/exam/:id/information/social-counts',
            params: {id:'@id'},
            cancellable: true
        },
        rating: {
            method: 'GET',
            url:'/u/exam/:id/dashboard/rating',
            params: {id:'@id'},
            cancellable: true
        },
        updateVotePoint: {
            method: 'PUT',
            url:'/u/exam/:id/dashboard/vote-point',
            params: {id:'@id'}
        },
        updateComment: {
            method: 'PUT',
            url:'/u/exam/:id/dashboard/info',
            params: {id:'@id'}
        },
        loadSameCreatorExam: {
            method: 'GET',
            url:'/exam/:id/information/same-creator/:creatorId?page=:page',
            params: {id:'@id',creatorId: '@creatorId', page: '@page'},
            cancellable: true
        },
        loadSimilarExam: {
            method: 'GET',
            url:'/exam/:id/information/similar-exam?q=:q',
            params: {id:'@id', q: '@q'},
            cancellable: true
        },
        access: {
            method: 'POST',
            url:'/u/exam/:id/dashboard/access',
            params: {id:'@id'}
        },
        requestVerification: {
            method: 'POST',
            url: '/u/exam/:id/dashboard/verification',
            params: {id:'@id'}
        },
        verifyCode: {
            method: 'POST',
            url: '/u/exam/:id/dashboard/verify-code',
            params: {id:'@id'}
        }
    });
}]);
mainApp.factory('LeaderBoardService', ['$resource', function($resource){
    return $resource('/u/exam/:id/dashboard', {id: '@id'}, {
        loadLeaderBoard: {
            method: 'GET',
            url:'/u/exam/:id/dashboard/leader-board/load',
            params: {id: '@id'},
            cancellable: true
        },
        loadMoreStudent: {
            method: 'GET',
            url: '/u/exam/:id/dashboard/leader-board/more?page=:page',
            params: {id: '@id', page: '@page'},
            cancellable: true
        }
    });
}]);
mainApp.factory('PasswordService', ['$resource', function($resource){
    return $resource('/password/change', null,{

    });
}]);
mainApp.factory('PrintingService', ['$resource', function($resource){
    return $resource('/u/exam/:id/printing', {id: '@id'}, {
        update: {method: 'PUT'},
        pay: {method: 'GET', url:'/u/exam/:id/printing/pay', params: {id:'@id'}},
        getSettings: {method: 'GET', url:'/u/exam/:id/printing/settings', params: {id:'@id'}},
        exportPdf: {method: 'GET', url:'/u/exam/:id/printing/export-pdf', params: {id:'@id'}},
        printPDF: {
            //get file directly (not link to click)
            method: 'GET',
            headers: {
                accept: 'application/pdf'
            },
            responseType: 'arraybuffer',
            cache: true,
            transformResponse: function (data, headers) {
                var pdf;
                if (data) {
                    pdf = new Blob([data], {
                        type: 'application/pdf'
                    });
                }

                var fileName = "filename.pdf";
                var header = headers('content-disposition');
                var result;
                if (header) {
                    result = header.split(";")[1].trim().split("=")[1];

                    fileName = result.replace(/"/g, '');
                }

                result = {
                    blob: pdf,
                    fileName: fileName
                };


                return {
                    response: result
                };
            },
            url:'/u/exam/:id/print-pdf',
            params:{id:'@id'}
        }
    });
}]);
mainApp.factory('ProfileService', ['$resource', function($resource){
    return $resource('/u/profile/edit', null, {
        vote: {
            method: 'POST',
            url: '/profile/vote/:userId',
            params: {userId: '@userId'}
        },
        verifyPassword: {
            method: 'POST',
            url: '/u/profile/verify/password'
        },
        verifyCode: {
            method: 'POST',
            url: '/u/profile/verify/code'
        },
        sendActivateEmail: {
            method: 'POST',
            url: '/u/profile/activate/email'
        },
        activate: {
            method: 'GET',
            url: '/activate/email?e=:e&code=:code&ajax=true',
            params: {e:'@e', code: '@code'}
        }
    });
}]);
mainApp.factory('QuestionService', ['$resource', function($resource){
    return $resource('/u/exam/:examId/section/:sectionId/question/:questionId', {examId: '@examId', sectionId: '@sectionId', questionId: '@questionId'},{
        update: {method: 'PUT'},
        updatePosition: {
            method: 'PUT',
            url:'/u/exam/:examId/section/:sectionId/question/position',
            params: {examId:'@examId', sectionId:'@sectionId'}
        },
        updateType: {
            method: 'PUT',
            url:'/u/exam/:examId/section/:sectionId/question/:questionId/type',
            params: {examId: '@examId', sectionId:'@sectionId', questionId: '@questionId'}
        }
    });
}]);

mainApp.factory('RegisterService', ['$resource', function($resource){
    return $resource('/', null, {
        verifyEmail: {
            method: 'POST',
            url:'/verifyEmail'
        },
        register: {
            method: 'POST',
            url: '/register'
        }
    });
}]);
mainApp.factory('RunService', ['$resource', function($resource){
    return $resource('/u/exam/:examId/run/question/:questionId', {examId: '@examId', questionId: '@questionId'},{
        getTime: {
            method: 'GET',
            url: 'http://www.timeapi.org/utc/now'
        },
        updateAnswers: {
            method: 'PUT',
            url:'/u/exam/:examId/run/question/:questionId/update-answers',
            params: {examId: '@examId', questionId:'@questionId'}
        },
        helpQuestion: {
            method: 'GET',
            url:'/u/exam/:examId/run/question/:questionId/help/:type',
            params: {examId: '@examId', questionId:'@questionId', type: '@type'},
            cancellable: true
        },
        closeQuestion: {
            method: 'POST',
            url:'/u/exam/:examId/run/question/:questionId/close',
            params: {examId: '@examId', questionId:'@questionId'}
        },
        getQuestionsStatus: {
            method: 'GET',
            url: '/u/exam/:examId/run/questions-status',
            params: {examId: '@examId'}
        },
        preLoadQuestion: {
            method: 'GET',
            url: '/u/exam/:examId/run/question/:questionId/pre-load',
            params: {examId: '@examId', questionId:'@questionId'},
            cancellable: true
        },
        decryptQuestion: {
            method: 'POST',
            url: '/u/exam/:examId/run/question/:questionId/decrypt',
            params: {examId: '@examId', questionId:'@questionId'}
        },
        loadQuestion: {
            method: 'GET',
            url: '/u/exam/:examId/run/question/:questionId/load',
            params: {examId: '@examId', questionId:'@questionId'},
            cancellable: true
        },
        loadAllQuestion: {
            method: 'GET',
            url: '/u/exam/:examId/run/question/:beginOrder/load-all',
            params: {examId: '@examId', beginOrder:'@beginOrder'},
            cancellable: true
        },
        //assessExam: {
        //    method: 'PUT',
        //    url: '/u/exam/:examId/run/question/assess-exam',
        //    params: {examId: '@examId'}
        //},
        finishExam: {
            method: 'PUT',
            url: '/u/exam/:examId/run/question/finish-exam',
            params: {examId: '@examId'}
        }
        //doStatistic: {
        //    method: 'GET',
        //    url: '/u/exam/:examId/run/question/do-statistic',
        //    params: {examId: '@examId'}
        //}
    });
}]);
mainApp.factory('SearchService', ['$resource', function($resource){
    return $resource('/search', null,{

    });
}]);
mainApp.factory('SectionService', ['$resource', function($resource){
    return $resource('/u/exam/:examId/section/:sectionId', {examId: '@examId', sectionId: '@sectionId'}, {
        get: {method: 'GET',  headers: {'Cache-Control' : 'no-cache'}, cache: false},
        update: {method: 'PUT'},
        updatePosition: {
            method: 'PUT',
            url:'/u/exam/:examId/section/position',
            params: {examId:'@examId'}
        }
    });
}]);
mainApp.factory('StatisticService', ['$resource', function($resource){
    return $resource('/u/exam/:examId/statistic', {examId: '@examId'},{
        loadExamContent: {
            method: 'GET',
            url:'/u/exam/:examId/statistic/exam-content',
            params: {examId: '@examId'},
            cancellable: true
        },
        loadUsersData: {
            method: 'GET',
            url:'/u/exam/:examId/statistic/users-data?page=:page',
            params: {examId: '@examId', page: '@page'},
            cancellable: true
        },
        analysis: {
            method: 'GET',
            url:'/u/exam/:examId/statistic/analysis',
            params: {examId: '@examId'}
        },
        // loadResults: {
        //     method: 'GET',
        //     url:'/u/exam/:examId/statistic/analysis',
        //     params: {examId: '@examId'},
        //     cancellable: true
        // },
        updateMark: {
            method: 'POST',
            url:'/u/exam/:examId/statistic/update-mark',
            params: {examId: '@examId'}
        },
        exportStatistics: {
            method: 'POST',
            url:'/u/exam/:examId/statistic/export',
            params: {examId: '@examId'},
            cancellable: true
        },
        loadUserDetail: {
            method: 'GET',
            url:'/u/exam/:examId/statistic/detail/:userId',
            params: {examId: '@examId', userId: '@userId'},
            cancellable: true
        },
        deleteUserExam: {
            method: 'POST',
            url:'/u/exam/:examId/statistic/delete/:userId',
            params: {examId: '@examId', userId: '@userId'}
        },
        refreshUserExam: {
            method: 'POST',
            url:'/u/exam/:examId/statistic/refresh/:userId',
            params: {examId: '@examId', userId: '@userId'}
        },
        terminateUserExam: {
            method: 'POST',
            url:'/u/exam/:examId/statistic/terminate/:userId',
            params: {examId: '@examId', userId: '@userId'}
        },
        deleteAllUserExam: {
            method: 'POST',
            url:'/u/exam/:examId/statistic/delete-all',
            params: {examId: '@examId'}
        }
    });
}]);
mainApp.controller('loginCtrl', ['$scope', function($scope){
    var loginVm = this;

    loginVm.init = function (data) {
        loginVm.email = data.email;
    };

}]);
mainApp.controller('passwordChangeCtrl',['$scope', '$timeout', '$window', 'PasswordService', function($scope, $timeout, $window, PasswordService) {

    var passwordChangeVm = this;
    passwordChangeVm.message = '';  //flag to display error message
    passwordChangeVm.successMessage = '';  //flag to display error message
    passwordChangeVm.changing = false; //flag to display waiting animation

    passwordChangeVm.init = function (data) {
        passwordChangeVm.email = data.email;
    };

    /**
     * just enable resetting flag (for display reset animation) if form is valid
     * @param isValid
     */
    passwordChangeVm.changePassword = function(isValid) {
        if (isValid) {
            passwordChangeVm.changing = true;
            passwordChangeVm.message = 'Đang thực hiện cập nhật lại mật khẩu...';

            var postData = {
                'email': passwordChangeVm.email,
                'currentPassword': passwordChangeVm.currentPassword,
                'password': passwordChangeVm.password,
                'password_confirmation': passwordChangeVm.password_confirmation
            };

            PasswordService.save({}, postData, function successCallback(response) {
                console.log(response);
                if (response.success) {
                    passwordChangeVm.message = '';
                    passwordChangeVm.successMessage = 'Mật khẩu đã được cập nhật thành công. Hệ thống đang quay lại trang chủ...';
                    $timeout(function () {
                        $window.location.href = '/';
                    }, 3000);
                } else {
                    passwordChangeVm.message = response.message;
                    passwordChangeVm.changing = false;
                }
            }, function errorCallback(response) {
                console.log('error');
                console.log(response);
                passwordChangeVm.message = 'Vui lòng kiểm tra lại thông tin đã nhập...';
                passwordChangeVm.changing = false;
            })
        }
    }
}]);
mainApp.controller('passwordEmailCtrl',['$scope', function($scope) {

    var passwordEmailVm = this;

    passwordEmailVm.sending = false; //flag to display waiting animation

    /**
     * Just enable sending flag (for display sending animation) if form is valid
     * @param isValid
     */
    passwordEmailVm.submitEmail = function(isValid) {
        if (isValid) {
            passwordEmailVm.sending = true;
        }
    };
}]);
mainApp.controller('passwordResetCtrl',['$scope', function($scope) {

    var passwordResetVm = this;

    passwordResetVm.resetting = false; //flag to display waiting animation

    /**
     * just enable resetting flag (for display reset animation) if form is valid
     * @param isValid
     */
    passwordResetVm.resetPassword = function(isValid) {
        if (isValid) {
            passwordResetVm.resetting = true;
        }
    }
}]);
mainApp.controller('registerCtrl',['$scope', '$window', 'RegisterService', function($scope, $window, RegisterService) {

    var registerVm = this;

    registerVm.birth = {};  //store user birthday
    registerVm.months = [
        'Tháng 1',
        'Tháng 2',
        'Tháng 3',
        'Tháng 4',
        'Tháng 5',
        'Tháng 6',
        'Tháng 7',
        'Tháng 8',
        'Tháng 9',
        'Tháng 10',
        'Tháng 11',
        'Tháng 12'
    ];      //month string list

    registerVm.showPass = false;    //flag to know display or not password
    registerVm.showPassStyle = {};  //style display password (background color)
    /**
     * show password to view
     * @param isShow
     */
    registerVm.displayPassword = function(isShow) {
        var passwordInputElm = angular.element(document.querySelector('.cq-password-input'));
        if (isShow) {
            registerVm.showPassStyle = {'background-color' : 'lightgrey'};
            passwordInputElm.attr('type', 'text');
        } else {
            registerVm.showPassStyle = {};
            passwordInputElm.attr('type', 'password');
        }
    };

    /**
     * delete all email error
     */
    registerVm.clearEmailError = function () {
        $scope.registerForm.email.$setValidity('required', true);
        $scope.registerForm.email.$setValidity('email', true);
        $scope.registerForm.email.$setValidity('maxlength', true);
        $scope.registerForm.email.$setValidity('conflict', true);
    };

    /**
     * check email is exist
     * @param $error
     */
    registerVm.verifyEmail = function ($error) {
        if (angular.isDefined($error.required) || angular.isDefined($error.email) || angular.isDefined($error.maxlength)) {
            return;
        }
        var registerService = new RegisterService();
        registerService['email'] = registerVm.email;

        $scope.registerForm.email.$setValidity("conflict", true);
        registerService.$verifyEmail(function successCallback(response) {
            $scope.registerForm.email.$setValidity("conflict", !response.exist);
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
        });
    };

    /**
     * clear all password error if any
     */
    registerVm.clearPasswordError = function () {
        $scope.registerForm.password.$setValidity('required', true);
        $scope.registerForm.password.$setValidity('minlength', true);
        $scope.registerForm.password.$setValidity('maxlength', true);
    };

    /**
     * submit data to register new account
     * @param isValid
     */
    registerVm.submitting = false;
    registerVm.registerSubmit = function(isValid) {
        if (isValid) {
            var registerService = new RegisterService();
            registerService['firstname'] = registerVm.firstname;
            registerService['lastname'] = registerVm.lastname;
            registerService['email'] = registerVm.email;
            registerService['password'] = registerVm.password;
            registerService['dateOfBirth'] = registerVm.birth.year + '-' + registerVm.birth.month + '-' + registerVm.birth.day;
            registerService['agree'] = registerVm.agree;

            registerVm.submitting = true;
            registerService.$register(function successCallback(response) {
                if (response.success) {
                    $window.location.href = response.redirect;
                } else {
                    registerVm.message = response.message;
                }
                registerVm.submitting = false;
            }, function errorCallback(response) {
                console.log('error');
                console.log(response);
                registerVm.message = 'Không đăng kí được';
                registerVm.submitting = false;
            });
        }
    };

}]);
mainApp.controller('coinManagerCtrl', ['$scope', '$timeout', '$location', '$window', '$uibModal', 'CoinService', function($scope, $timeout, $location, $window, $uibModal, CoinService){
    var coinManagerVm = this;

    coinManagerVm.init = function (data) {
        switch ($location.hash()) {
            case 'introduction':
                coinManagerVm.viewTab = 'introduction';
                break;
            case 'topup':
                coinManagerVm.viewTab = 'topup';
                break;
            case 'withdraw':
                coinManagerVm.viewTab = 'withdraw';
                break;
            case 'history':
                coinManagerVm.viewTab = 'history';
                break;
            case 'voucher_new':
                coinManagerVm.viewTab = 'voucher_new';
                break;
            case 'voucher_use':
                coinManagerVm.viewTab = 'voucher_use';
                break;
            default:
                coinManagerVm.viewTab = 'introduction';
                break;
        }
        coinManagerVm.identifyTopUpIconSize();

        coinManagerVm.email = data.email;

        coinManagerVm.isWithdrawing = data.isWithdrawing;
        coinManagerVm.createdAt = data.createdAt;
        coinManagerVm.coinDelta = data.coinDelta;
        coinManagerVm.withdrawBank = data.withdrawBank;
        coinManagerVm.withdrawBankId = data.withdrawBankId;

        coinManagerVm.paymentMethod = 'atm-banking'; //internet-banking

        coinManagerVm.coin = data.coin;
        coinManagerVm.withdrawCoin = 50; //min coin

        coinManagerVm.startHistory = moment().startOf('month').toDate();
        coinManagerVm.endHistory = moment().toDate();
        $timeout(coinManagerVm.loadTransactionHistory);

        coinManagerVm.voucherPrice = 10;
        coinManagerVm.voucherAmount = 0;
        coinManagerVm.voucherMax = Math.floor(coinManagerVm.coin/coinManagerVm.voucherPrice);
        coinManagerVm.voucherSum = coinManagerVm.voucherAmount * coinManagerVm.voucherPrice;
        coinManagerVm.voucherRemainCoin = coinManagerVm.coin - coinManagerVm.voucherSum;
        $timeout(coinManagerVm.loadVoucherList);

        coinManagerVm.exchangeCoinRate = angular.isUndefined(data.exchangeCoinRate) ? 1000 : data.exchangeCoinRate; //(VND)

        coinManagerVm.atmBankingValue = 20000;
        coinManagerVm.selectedAtmBank = null;
        coinManagerVm.changeAtmBankingValue();

        coinManagerVm.internetBankingValue = 20000;
        coinManagerVm.selectedInternetBank = null;
        coinManagerVm.changeInternetBankingValue();

        coinManagerVm.creditCardValue = 20000;
        coinManagerVm.selectedCreditCard = null;
        coinManagerVm.changeCreditCardValue();

        coinManagerVm.scratchcardValue = 20000;
        coinManagerVm.selectedScratchcard = null;
        coinManagerVm.scratchcardFee = null;
        coinManagerVm.changeScratchcardValue();
    };

    coinManagerVm.changeTab = function (tabLabel) {
        coinManagerVm.viewTab = tabLabel;
        $location.hash(tabLabel);
    };

    //<editor-fold desc="withdraw">
    coinManagerVm.submitWithdraw = function (isValid) {
        if (!isValid) return;

        var withdrawPasswordModalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'withdrawPasswordModal.html',
            controller: 'withdrawPasswordCtrl',
            controllerAs: 'withdrawPasswordVm',
            keyboard: false,
            backdrop: 'static'
        });

        withdrawPasswordModalInstance.result.then(function (isVerifiedPassword){
            if (isVerifiedPassword) {
                var codeModalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'withdrawCodeModal.html',
                    controller: 'withdrawCodeCtrl',
                    controllerAs: 'withdrawCodeVm',
                    keyboard: false,
                    backdrop: 'static'
                });

                codeModalInstance.result.then(function (result) {
                    if (result.success) {
                        var withdrawTransactionModalInstance = $uibModal.open({
                            animation: true,
                            templateUrl: 'withdrawTransactionModal.html',
                            controller: 'withdrawTransactionCtrl',
                            controllerAs: 'withdrawTransactionVm',
                            keyboard: false,
                            backdrop: 'static',
                            resolve: {
                                transactionData: function () {
                                    var data = {};
                                    data['withdrawCoin'] = coinManagerVm.withdrawCoin;
                                    data['withdrawBank'] = coinManagerVm.withdrawBank;
                                    data['withdrawBankId'] = coinManagerVm.withdrawBankId;
                                    data['withdrawCode'] = result.code;
                                    return data;
                                }
                            }
                        });

                        withdrawTransactionModalInstance.result.then(function (result) {
                            if (result.success) {
                                coinManagerVm.isWithdrawing = true;
                                coinManagerVm.createdAt = new Date();
                                coinManagerVm.coinDelta = coinManagerVm.withdrawCoin;
                                coinManagerVm.coin = result.coin;
                            }
                        });
                    }
                });
            }
        });
    };

    coinManagerVm.cancelWithdrawTransaction = function () {
        var cancelWithdrawModalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'withdrawCancelModal.html',
            controller: 'withdrawCancelCtrl',
            controllerAs: 'withdrawCancelVm',
            keyboard: true
        });

        cancelWithdrawModalInstance.result.then(function (result){
            if (result.success) {
                coinManagerVm.isWithdrawing = false;
                coinManagerVm.coin = result.coin;
            }
        });
    };
    //</editor-fold>

    //<editor-fold desc="history">
    coinManagerVm.loadingTransactionHistory = false;
    coinManagerVm.transactions = [];
    coinManagerVm.startHistory = null;
    coinManagerVm.endHistory = null;
    coinManagerVm.page = 0;
    coinManagerVm.isLastPage = false;
    coinManagerVm.filter = 'all'; //display all type
    coinManagerVm.transactionService = null;

    coinManagerVm.loadTransactionHistory = function () {
        if (coinManagerVm.loadingTransactionHistory) return;

        if (coinManagerVm.startHistory != null && coinManagerVm.endHistory != null) {
            var nextDateOfEnd = new Date(coinManagerVm.endHistory.getTime());
            nextDateOfEnd.setDate(nextDateOfEnd.getDate() + 1); //add 1 day to get results in this day

            if (coinManagerVm.startHistory > coinManagerVm.endHistory) return;

            var parameters = {
                start: coinManagerVm.convertDateToString(coinManagerVm.startHistory),
                end: coinManagerVm.convertDateToString(nextDateOfEnd),
                page: coinManagerVm.page + 1
            };

            if (coinManagerVm.page == 0) {
                coinManagerVm.transactions = [];
                coinManagerVm.isLastPage = false;
            }

            coinManagerVm.loadingTransactionHistory = true;
            coinManagerVm.transactionService = CoinService.loadTransactions(parameters, function successCallback(response) {
                if (response.success) {
                    coinManagerVm.page++;
                    if (response.result.length == 0) {
                        coinManagerVm.isLastPage = true;
                    } else {
                        coinManagerVm.transactions.push.apply(coinManagerVm.transactions, response.result);
                    }
                }
                coinManagerVm.loadingTransactionHistory = false;

            }, function errorCallback(response) {
                console.log('error');
                console.log(response);
                coinManagerVm.loadingTransactionHistory = false;

            });
        }
    };

    coinManagerVm.convertDateToString = function (myDate) {
        var dd = myDate.getDate();
        var mm = myDate.getMonth()+1; //January is 0!
        var yyyy = myDate.getFullYear();

        if(dd<10) {
            dd='0'+dd
        }

        if(mm<10) {
            mm='0'+mm
        }

        return yyyy + '-' + mm + '-' + dd;
    };

    coinManagerVm.updateResult = function () {
        //cancel current request if any
        coinManagerVm.transactionService.$cancelRequest();

        //user changed start or end history date, so load exam again
        coinManagerVm.page = 0;
        coinManagerVm.loadTransactionHistory();
    };

    coinManagerVm.loadMoreResult = function () {
        if (coinManagerVm.isLastPage || coinManagerVm.loadingTransactionHistory) return;

        //console.log('go here');
        //coinManagerVm.page++;
        coinManagerVm.loadTransactionHistory();
    };

    coinManagerVm.checkDisplay = function(transactionType) {
        var isDisplay = true;
        //TRANSACTION TYPE
        //      'PAY' => 0,
        //     'RECEIVE' => 1,
        //     'TOP_UP' => 2,
        //     'WITHDRAW' => 3

        switch (coinManagerVm.filter) {
            case 'pay':
                if (transactionType != 0) isDisplay = false;
                break;
            case 'receive':
                if (transactionType != 1) isDisplay = false;
                break;
            case 'topup':
                if (transactionType != 2) isDisplay = false;
                break;
            case 'withdraw':
                if (transactionType != 3) isDisplay = false;
                break;
            default:
                isDisplay = true; //all case
                break;
        }
        return isDisplay;
    };
    //</editor-fold>

    coinManagerVm.voucherListService = null;
    coinManagerVm.loadingVoucherList = false;
    coinManagerVm.voucherList = [];
    coinManagerVm.loadVoucherList = function() {
        coinManagerVm.loadingVoucherList = true;
        coinManagerVm.voucherListService = CoinService.loadVoucherList({}, function successCallback(response) {
            console.log(response);
            if (response.success) {
                coinManagerVm.voucherList = response.voucherList;
            }
            coinManagerVm.loadingVoucherList = false;

        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            coinManagerVm.loadingVoucherList = false;

        });
    };

    coinManagerVm.modifyVoucherMax = function () {
        coinManagerVm.voucherMax = Math.floor(coinManagerVm.coin/coinManagerVm.voucherPrice);
        coinManagerVm.voucherSum = (angular.isDefined(coinManagerVm.voucherAmount) && angular.isDefined(coinManagerVm.voucherPrice))
            ? Math.max(0, coinManagerVm.voucherAmount * coinManagerVm.voucherPrice) : 0;
        coinManagerVm.voucherRemainCoin = coinManagerVm.coin - coinManagerVm.voucherSum;
    };

    coinManagerVm.modifyVoucherAmount = function () {
        coinManagerVm.voucherSum = (angular.isDefined(coinManagerVm.voucherAmount) && angular.isDefined(coinManagerVm.voucherPrice))
            ? Math.max(0, coinManagerVm.voucherAmount * coinManagerVm.voucherPrice) : 0;
        coinManagerVm.voucherRemainCoin = coinManagerVm.coin - coinManagerVm.voucherSum;
    };

    coinManagerVm.createVoucherMessage = '';
    coinManagerVm.creatingVoucherList = false;
    coinManagerVm.createVoucher = function (isValid) {
        coinManagerVm.createVoucherMessage = '';
        if (isValid && coinManagerVm.voucherSum > 0 && !coinManagerVm.creatingVoucherList) {
            var voucherPasswordModalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'voucherPasswordModal.html',
                controller: 'voucherPasswordCtrl',
                controllerAs: 'voucherPasswordVm',
                keyboard: false,
                backdrop: 'static'
            });

            voucherPasswordModalInstance.result.then(function (isVerifiedPassword){
                if (isVerifiedPassword) {
                    var voucherCodeModalInstance = $uibModal.open({
                        animation: true,
                        templateUrl: 'voucherCodeModal.html',
                        controller: 'voucherCodeCtrl',
                        controllerAs: 'voucherCodeVm',
                        keyboard: false,
                        backdrop: 'static',
                        resolve: {
                            voucherInfo: function () {
                                return {
                                    'price': coinManagerVm.voucherPrice,
                                    'amount': coinManagerVm.voucherAmount
                                }
                            }
                        }
                    });

                    voucherCodeModalInstance.result.then(function (result) {
                        if (result.success) {
                            coinManagerVm.voucherList = result.newVoucherList;
                            coinManagerVm.coin = result.newCoin;
                            coinManagerVm.createVoucherMessage = 'Đã tạo các voucher thành công.';
                        }
                    });
                }
            });

            // coinManagerVm.creatingVoucherList = true;
            // CoinService.createVoucher({}, function successCallback(response) {
            //     console.log(response);
            //     if (response.success) {
            //         coinManagerVm.voucherList = response.newVoucherList;
            //         coinManagerVm.coin = response.newCoin;
            //     } else {
            //         coinManagerVm.createVoucherMessage = response.message;
            //     }
            //     coinManagerVm.creatingVoucherList = false;
            //
            // }, function errorCallback(response) {
            //     console.log('error');
            //     console.log(response);
            //     coinManagerVm.creatingVoucherList = false;
            //     coinManagerVm.createVoucherMessage = 'Không thể tạo voucher.';
            //
            // });
        }
    };

    coinManagerVm.activateVoucherMessage = '';
    coinManagerVm.activatingVoucher = false;
    coinManagerVm.activateVoucher = function (isValid) {
        if (isValid && !coinManagerVm.activatingVoucher) {
            coinManagerVm.activatingVoucher = true;
            coinManagerVm.activateVoucherMessage = '';
            CoinService.activateVoucher({}, {'email': coinManagerVm.email, 'serial': coinManagerVm.voucherSerial}, function successCallback(response) {
                console.log(response);
                if (response.success) {
                    coinManagerVm.coin = response.newCoin;
                    coinManagerVm.voucherSerial = '';
                    $scope.useVoucherForm.$setPristine();
                    $scope.useVoucherForm.$setUntouched();
                    coinManagerVm.activateVoucherMessage = 'Đã nạp thành công. Số xu mới của bạn là ' + coinManagerVm.coin;
                } else {
                    coinManagerVm.activateVoucherMessage = response.message;
                }
                coinManagerVm.activatingVoucher = false;

            }, function errorCallback(response) {
                console.log('error');
                console.log(response);
                coinManagerVm.activatingVoucher = false;
                coinManagerVm.activateVoucherMessage = 'Không thể kích hoạt voucher.';

            });
        }
    };

    coinManagerVm.changeAtmBankingValue = function () {
        if (coinManagerVm.atmBankingValue == null) {
            coinManagerVm.atmBankingExchange = 0;
        } else {
            coinManagerVm.atmBankingExchange =
                Math.floor((coinManagerVm.atmBankingValue - (1760 + 0.011 * coinManagerVm.atmBankingValue))/coinManagerVm.exchangeCoinRate);
        }
    };

    coinManagerVm.processingAtmBanking = false;
    coinManagerVm.processAtmBanking = function (isValid) {
        if (!isValid) return;

        coinManagerVm.processingAtmBanking = true;
        coinManagerVm.processAtmBankingMessage = '';
        CoinService.doAtmBankPayment({}, {'email': coinManagerVm.email,'amount': coinManagerVm.atmBankingValue, 'bank': coinManagerVm.selectedAtmBank}, function successCallback(response) {
            console.log(response);
            if (response.success) {
                $window.location.href = response.checkout_url;
            } else {
                coinManagerVm.processAtmBankingMessage = response.message;
            }
            coinManagerVm.processingAtmBanking = false;
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            coinManagerVm.processAtmBankingMessage = 'Không thể kết nối được với server';
            coinManagerVm.processingAtmBanking = false;
        });
    };

    coinManagerVm.changeInternetBankingValue = function () {
        if (coinManagerVm.internetBankingValue == null) {
            coinManagerVm.internetBankingExchange = 0;
        } else {
            coinManagerVm.internetBankingExchange =
                Math.floor((coinManagerVm.internetBankingValue - (1760 + 0.011 * coinManagerVm.internetBankingValue))/coinManagerVm.exchangeCoinRate);
        }
    };

    coinManagerVm.processingInternetBanking = false;
    coinManagerVm.processInternetBanking = function (isValid) {
        if (!isValid) return;

        coinManagerVm.processingInternetBanking = true;
        coinManagerVm.processInternetBankingMessage = '';
        CoinService.doIBankPayment({}, {'email': coinManagerVm.email,'amount': coinManagerVm.internetBankingValue, 'bank': coinManagerVm.selectedInternetBank}, function successCallback(response) {
            console.log(response);
            if (response.success) {
                $window.location.href = response.checkout_url;
            } else {
                coinManagerVm.processInternetBankingMessage = response.message;
            }
            coinManagerVm.processingInternetBanking = false;
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            coinManagerVm.processInternetBankingMessage = 'Không thể kết nối được với server';
            coinManagerVm.processingInternetBanking = false;
        });
    };

    coinManagerVm.changeCreditCardValue = function () {
        if (coinManagerVm.creditCardValue == null) {
            coinManagerVm.creditCardExchange = 0;
        } else {
            coinManagerVm.creditCardExchange =
                Math.floor((coinManagerVm.creditCardValue - (5500 + 0.03 * coinManagerVm.creditCardValue))/coinManagerVm.exchangeCoinRate);
        }
    };

    coinManagerVm.processingCreditCard = false;
    coinManagerVm.processCreditCard = function (isValid) {
        if (!isValid) return;

        coinManagerVm.processingCreditCard = true;
        coinManagerVm.processCreditCardMessage = '';
        CoinService.doCreditCardPayment({}, {'email': coinManagerVm.email, 'amount': coinManagerVm.creditCardValue, 'bank': coinManagerVm.selectedCreditCard}, function successCallback(response) {
            console.log(response);
            if (response.success) {
                $window.location.href = response.checkout_url;
            } else {
                coinManagerVm.processCreditCardMessage = response.message;
            }
            coinManagerVm.processingCreditCard = false;
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            coinManagerVm.processCreditCardMessage = 'Không thể kết nối được với server';
            coinManagerVm.processingCreditCard = false;
        });
    };

    coinManagerVm.changeSelectedScratchcard = function () {
        if (coinManagerVm.selectedScratchcard == null) return;

        switch (coinManagerVm.selectedScratchcard) {
            case 'viettel': //viettel
                coinManagerVm.scratchcardFee = 20;
                break;
            case 'vms': //mobiphone
                coinManagerVm.scratchcardFee = 20;
                break;
            case 'vnp': //vinaphone
                coinManagerVm.scratchcardFee = 20;
                break;
            case 'gate': //vinaphone
                coinManagerVm.scratchcardFee = 18;
                break;
            default:
                coinManagerVm.scratchcardFee = null;
                break;
        }
        coinManagerVm.changeScratchcardValue();
    };

    coinManagerVm.changeScratchcardValue = function () {
        if (coinManagerVm.scratchcardValue == null || coinManagerVm.scratchcardFee == null) {
            coinManagerVm.scratchcardExchange = 0;
        } else {
            coinManagerVm.scratchcardExchange =
                Math.floor((coinManagerVm.scratchcardValue - ((coinManagerVm.scratchcardFee/100) * coinManagerVm.scratchcardValue))/coinManagerVm.exchangeCoinRate);
        }
    };

    coinManagerVm.processingScratchcard = false;
    coinManagerVm.processScratchcard = function (isValid) {
        if (!isValid) return;

        coinManagerVm.processingScratchcard = true;
        coinManagerVm.processScratchcardMessage = '';
        CoinService.doScratchcardPayment({}, {'email': coinManagerVm.email,'amount': coinManagerVm.scratchcardValue, 'typeCard': coinManagerVm.selectedScratchcard, 'pin': coinManagerVm.scratchcardPin, 'serial': coinManagerVm.scratchcardSerial}, function successCallback(response) {
            console.log(response);
            if (response.success) {
                //$window.location.href = response.checkout_url;
                var scratchcardModalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'scratchcardModal.html',
                    controller: 'scratchcardCtrl',
                    controllerAs: 'scratchcardVm',
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        scratchcardData: function () {
                            return response.data;
                        }
                    }
                });

                scratchcardModalInstance.result.then(function (){
                    $window.location.reload();
                });
            } else {
                coinManagerVm.processScratchcardMessage = response.message;
            }
            coinManagerVm.processingScratchcard = false;
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            coinManagerVm.processScratchcardMessage = 'Không thể kết nối được với server';
            coinManagerVm.processingScratchcard = false;
        });
    };

    //detect window size change and update question list and draw matching link
    coinManagerVm.myWindow = angular.element($window);  //get current window element
    //callback function when window is changed size
    coinManagerVm.myWindow.on('resize', function() {
        coinManagerVm.identifyTopUpIconSize();

        // don't forget manually trigger $digest()
        $scope.$digest();
    });

    coinManagerVm.identifyTopUpIconSize = function () {
        coinManagerVm.fa5x = coinManagerVm.fa4x = coinManagerVm.fa3x = coinManagerVm.fa2x = coinManagerVm.faLg = false;
        var width = coinManagerVm.myWindow.width();
        if(width > 1150) {
            coinManagerVm.fa5x = true;
        } else if(width <= 1150 && width > 880) {
            coinManagerVm.fa4x = true;
        } else if (width <= 880 && width > 526) {
            coinManagerVm.fa3x = true;
        } else if (width <= 526 && width > 350) {
            coinManagerVm.fa2x = true;
        } else {
            coinManagerVm.faLg = true;
        }
    };

    $scope.$on('$locationChangeSuccess', function (event, current, previous) {
        //this is how your track of the navigation history
        if (current == previous) return;

        //compare after remove hash
        if (current.split('#')[0] == previous.split('#')[0]) return;

        if (coinManagerVm.transactionService != null) {
            coinManagerVm.transactionService.$cancelRequest();
        }

        if (coinManagerVm.voucherListService != null) {
            coinManagerVm.voucherListService.$cancelRequest();
        }
    });

}]);
mainApp.controller('scratchcardCtrl', ['$scope', '$uibModalInstance', 'scratchcardData', function($scope, $uibModalInstance, scratchcardData){
    var scratchcardVm = this; //view's model for detail controller
    scratchcardVm.scratchcardData = scratchcardData;

    scratchcardVm.close = function () {
        $uibModalInstance.close();
    };
}]);
mainApp.controller('voucherCodeCtrl', ['$scope', '$uibModalInstance', 'CoinService', 'voucherInfo', function($scope, $uibModalInstance, CoinService, voucherInfo){
    var voucherCodeVm = this; //view's model for detail controller
    voucherCodeVm.code = '';
    voucherCodeVm.statusMessage = '';
    voucherCodeVm.processing = false;

    voucherCodeVm.cancel = function () {
        $uibModalInstance.close({
            'success': false
        });
    };

    voucherCodeVm.finish = function () {
        if (voucherCodeVm.code == ''
            || voucherCodeVm.code.length != 16) {
            voucherCodeVm.statusMessage = 'Mã không hợp lệ';
            return;
        }

        voucherCodeVm.processing = true;
        voucherCodeVm.statusMessage = 'Hệ thống đang kiểm tra mã và tạo voucher...';
        CoinService.verifyCodeWithCreateVoucher({}, {code: voucherCodeVm.code, price: voucherInfo.price, amount: voucherInfo.amount}, function successCallback(response) {
            if (response.success) {
                $uibModalInstance.close({
                    'success': true,
                    'newVoucherList': response.newVoucherList,
                    'newCoin': response.newCoin
                });
            } else {
                voucherCodeVm.statusMessage = response.message;
            }
            voucherCodeVm.processing = false;
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            voucherCodeVm.statusMessage = 'Không thực hiện được.';
            voucherCodeVm.processing = false;
        });
    };

}]);
mainApp.controller('voucherPasswordCtrl', ['$scope', '$uibModalInstance', 'CoinService', function($scope, $uibModalInstance, CoinService){
    var voucherPasswordVm = this; //view's model for detail controller
    voucherPasswordVm.password = '';
    voucherPasswordVm.statusMessage = '';
    voucherPasswordVm.processing = false;

    voucherPasswordVm.cancel = function () {
        $uibModalInstance.close(false);
    };

    voucherPasswordVm.finish = function () {
        if (voucherPasswordVm.password == ''
            || voucherPasswordVm.password.length < 8
            || voucherPasswordVm.password.length > 255) {
            voucherPasswordVm.statusMessage = 'Mật khẩu không hợp lệ';
            return;
        }

        voucherPasswordVm.processing = true;
        voucherPasswordVm.statusMessage = 'Hệ thống đang xử lý, vui lòng đợi trong giây lát...';
        CoinService.verifyPasswordVoucher({}, {password: voucherPasswordVm.password}, function successCallback(response) {
            if (response.success) {
                $uibModalInstance.close(true);
            } else {
                voucherPasswordVm.statusMessage = 'Mật khẩu không khớp.';
            }
            voucherPasswordVm.processing = false;
        }, function errorCallback(response) {
            voucherPasswordVm.statusMessage = 'Lỗi kiểm tra mật khẩu.';
            voucherPasswordVm.processing = false;
        });
    };

}]);
mainApp.controller('withdrawCancelCtrl', ['$scope', '$uibModalInstance', 'CoinService', function($scope, $uibModalInstance, CoinService){
    var withdrawCancelVm = this; //view's model for detail controller
    withdrawCancelVm.statusMessage = '';
    withdrawCancelVm.processing = false;

    withdrawCancelVm.cancel = function () {
        $uibModalInstance.close({
            success: false,
            coin: 0
        });
    };

    withdrawCancelVm.finish = function () {
        withdrawCancelVm.processing = true;
        withdrawCancelVm.statusMessage = 'Hệ thống đang hủy giao dịch ...';
        CoinService.cancelWithdraw({}, {confirmed: true}, function successCallback(response) {
            if (response.success) {
                $uibModalInstance.close({
                    success: true,
                    coin: response.coin
                });
            } else {
                withdrawCancelVm.statusMessage = 'Lỗi không hủy được giao dịch.';
            }
            withdrawCancelVm.processing = false;
        }, function errorCallback(response) {
            withdrawCancelVm.statusMessage = 'Lỗi kết nối server.';
            withdrawCancelVm.processing = false;
        });
    };

}]);
mainApp.controller('withdrawCodeCtrl', ['$scope', '$uibModalInstance', 'CoinService', function($scope, $uibModalInstance, CoinService){
    var withdrawCodeVm = this; //view's model for detail controller
    withdrawCodeVm.code = '';
    withdrawCodeVm.statusMessage = '';
    withdrawCodeVm.processing = false;

    withdrawCodeVm.cancel = function () {
        $uibModalInstance.close({
            'success': false,
            'code': withdrawCodeVm.code
        });
    };

    withdrawCodeVm.finish = function () {
        if (withdrawCodeVm.code == ''
            || withdrawCodeVm.code.length != 16) {
            withdrawCodeVm.statusMessage = 'Mã không hợp lệ';
            return;
        }

        withdrawCodeVm.processing = true;
        withdrawCodeVm.statusMessage = 'Hệ thống đang kiểm tra mã...';
        CoinService.verifyCode({}, {code: withdrawCodeVm.code}, function successCallback(response) {
            if (response.success) {
                $uibModalInstance.close({
                    'success': true,
                    'code': withdrawCodeVm.code
                });
            } else {
                withdrawCodeVm.statusMessage = 'Mã không khớp.';
            }
            withdrawCodeVm.processing = false;
        }, function errorCallback(response) {
            withdrawCodeVm.statusMessage = 'Lỗi kiểm tra mã.';
            withdrawCodeVm.processing = false;
        });
    };

}]);
mainApp.controller('withdrawPasswordCtrl', ['$scope', '$uibModalInstance', 'CoinService', function($scope, $uibModalInstance, CoinService){
    var withdrawPasswordVm = this; //view's model for detail controller
    withdrawPasswordVm.password = '';
    withdrawPasswordVm.statusMessage = '';
    withdrawPasswordVm.processing = false;

    withdrawPasswordVm.cancel = function () {
        $uibModalInstance.close(false);
    };

    withdrawPasswordVm.finish = function () {
        if (withdrawPasswordVm.password == ''
            || withdrawPasswordVm.password.length < 8
            || withdrawPasswordVm.password.length > 255) {
            withdrawPasswordVm.statusMessage = 'Mật khẩu không hợp lệ';
            return;
        }

        withdrawPasswordVm.processing = true;
        withdrawPasswordVm.statusMessage = 'Hệ thống đang xử lý, vui lòng đợi trong giây lát...';
        CoinService.verifyPassword({}, {password: withdrawPasswordVm.password}, function successCallback(response) {
            if (response.success) {
                $uibModalInstance.close(true);
            } else {
                withdrawPasswordVm.statusMessage = 'Mật khẩu không khớp.';
            }
            withdrawPasswordVm.processing = false;
        }, function errorCallback(response) {
            withdrawPasswordVm.statusMessage = 'Lỗi kiểm tra mật khẩu.';
            withdrawPasswordVm.processing = false;
        });
    };

}]);
mainApp.controller('withdrawTransactionCtrl', ['$scope', '$uibModalInstance', 'CoinService', 'transactionData', function($scope, $uibModalInstance, CoinService, transactionData){
    var withdrawTransactionVm = this; //view's model for detail controller
    withdrawTransactionVm.withdrawCoin = transactionData['withdrawCoin'];
    withdrawTransactionVm.withdrawBank = transactionData['withdrawBank'];
    withdrawTransactionVm.withdrawBankId = transactionData['withdrawBankId'];
    withdrawTransactionVm.withdrawCode = transactionData['withdrawCode'];
    withdrawTransactionVm.value = '';
    withdrawTransactionVm.statusMessage = '';
    withdrawTransactionVm.processing = false;

    withdrawTransactionVm.cancel = function () {
        $uibModalInstance.close({
            success: false,
            coin: 0
        });
    };

    withdrawTransactionVm.finish = function () {
        withdrawTransactionVm.processing = true;
        withdrawTransactionVm.statusMessage = 'Đang hoàn thành giao dịch...';
        var postData = {};
        postData['withdrawCoin'] = withdrawTransactionVm.withdrawCoin;
        postData['withdrawBank'] = withdrawTransactionVm.withdrawBank;
        postData['withdrawBankId'] = withdrawTransactionVm.withdrawBankId;
        postData['withdrawCode'] = withdrawTransactionVm.withdrawCode;

        CoinService.withdraw({}, postData, function successCallback(response) {
            if (response.success) {
                $uibModalInstance.close({
                    success: true,
                    coin: response.coin
                });
            } else {
                withdrawTransactionVm.statusMessage = 'Lỗi thực hiện giao dịch.';
            }
            withdrawTransactionVm.processing = false;
        }, function errorCallback(response) {
            withdrawTransactionVm.statusMessage = 'Lỗi thực hiện giao dịch.';
            withdrawTransactionVm.processing = false;
        });

    };

}]);
mainApp.controller('commentCtrl', ['$scope', '$timeout', 'CommentService', function($scope, $timeout, CommentService){
    var commentVm = this;
    commentVm.userComment = '';
    commentVm.message = '';

    commentVm.changing = false;
    commentVm.focusEditor = function () {
        commentVm.changing = true;
        commentVm.message = '';
    };

    commentVm.sending = false;
    commentVm.sendComment = function ($isValid) {
        commentVm.changing = false;
        if (!$isValid) return;

        commentVm.sending = true;
        CommentService.send({}, {comment: commentVm.userComment}, function successCallback(response) {
            console.log(response);
            commentVm.sending = false;
            if (response.success) {
                commentVm.message = 'Phản hồi đã được ghi nhận.';
                commentVm.userComment = '';
                commentVm.changing = true;
            } else {
                commentVm.message = response.message;
            }
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            commentVm.sending = false;
            commentVm.message = 'Không lưu được';

        });
    };
}]);
mainApp.controller('searchCtrl', ['$scope', '$timeout', '$location', '$window', 'SearchService', function($scope, $timeout, $location, $window, SearchService){
    var searchVm = this;
    searchVm.query = null;
    searchVm.result = null;   //store search result
    searchVm.loading = false;   //loading flag

    /**
     * init search page with some parameter
     * @param query
     * @param page
     */
    searchVm.init = function(query, page) {
        searchVm.query = angular.isDefined(query) ? query.trim() : '';
        searchVm.currentPage = angular.isDefined(page) ? page : 0;
        $timeout(searchVm.searchExams);
    };

    /**
     * redirect to search page on header bar in other pages
     */
    searchVm.redirectToSearchPage = function () {
        searchVm.query = searchVm.query.trim();
        if (searchVm.query.length === 0 ) return;

        $window.location.href = '/search?q=' + searchVm.query;
    };

    /**
     * post query and page to receive search results
     * @param isNew
     */
    searchVm.searchExams = function(isNew) {
        searchVm.query = searchVm.query.trim();
        if (searchVm.query.length === 0 || searchVm.loading) {
            //clear result
            return;
        }

        if (isNew) {
            searchVm.currentPage = 0;
        }

        //change path
        if (searchVm.currentPage == 0) {
            $location.path('/search').search({'q': searchVm.query});
        } else {
            $location.path('/search').search({'q': searchVm.query, 'page': searchVm.currentPage});
        }

        var searchService = new SearchService();
        searchService['q'] = searchVm.query;
        if (searchVm.currentPage != 0) searchService['page'] = searchVm.currentPage;

        searchVm.loading = true;
        searchService.$save(function successCallback(response){ //POST
            searchVm.result = response.result;
            searchVm.currentPage = response.result.current_page;
            searchVm.prevLink = '/' + response.result.prev_page_url;
            searchVm.nextLink = '/' + response.result.next_page_url;
            searchVm.numPage = response.result.last_page;

            searchVm.displaySearchPagination();

            //scroll to top
            $window.scrollTo(0, 0);

            searchVm.loading = false;

        }, function errorCallback(response){
            searchVm.loading = false;
        });
    };

    //for display pagination
    searchVm.pages = {};
    searchVm.pages.previous = '';
    searchVm.pages.next = '';
    searchVm.currentPage = 0;
    searchVm.numPage = 0;
    searchVm.prevLink = '';
    searchVm.nextLink = '';
    searchVm.pages.viewFrame = [];

    /**
     * display pagination
     */
    searchVm.displaySearchPagination = function () {
        searchVm.identifyNumberItemPerPage();

        var middle = searchVm.numberItemPerPage/2;

        //if page index larger than middle, it will be stand on position middle
        var firstPage = (searchVm.currentPage > middle) ? (searchVm.currentPage - middle) : 1;

        //from 1...n button
        var n = Math.min(firstPage + parseInt(searchVm.numberItemPerPage), searchVm.numPage);
        var k = Math.max(n - parseInt(searchVm.numberItemPerPage) + 1, 1);
        searchVm.pages.viewFrame = [];
        for (var i = k; i<=n; i++) {
            var page = {};
            page.index = i;
            page.link = '/search?q=' + searchVm.query + '&page=' + page.index;
            searchVm.pages.viewFrame.push(page);
        }

        searchVm.pages.previous = (searchVm.currentPage > 1) ? searchVm.prevLink : '';
        searchVm.pages.next = (searchVm.currentPage < searchVm.numPage) ? searchVm.nextLink : '';
    };

    searchVm.numberItemPerPage = 0;
    searchVm.identifyNumberItemPerPage = function () {
        //all magic width in this function is identified by experience (manually)
        var width = searchVm.myWindow.width();
        if(width > 880) {
            searchVm.numberItemPerPage = 10;
        } else if (width <= 880 && width > 526) {
            searchVm.numberItemPerPage = 8;
        } else if (width <= 526 && width > 350) {
            searchVm.numberItemPerPage = 4;
        } else {
            searchVm.numberItemPerPage = 2;
        }
    };

    //detect window size change and update pagination
    searchVm.myWindow = angular.element($window);
    searchVm.myWindow.on('resize', function() {
        searchVm.displaySearchPagination();

        // don't forget manually trigger $digest()
        $scope.$digest();
    });

    searchVm.goPrevious = function () {
        if (angular.isUndefined(searchVm.currentPage) || searchVm.currentPage <= 1)
            return;
        searchVm.currentPage--;
        searchVm.searchExams(false);
    };

    searchVm.goTo = function (page) {
        if (searchVm.currentPage == page) return;

        searchVm.currentPage = page;
        searchVm.searchExams(false);
    };

    searchVm.goNext = function () {
        if (angular.isUndefined(searchVm.currentPage) || searchVm.currentPage >= searchVm.numPage)
            return;

        if (searchVm.currentPage == 0) searchVm.currentPage = 1;

        searchVm.currentPage++;
        searchVm.searchExams(false);
    };

}]);
mainApp.controller('shortcutKeyCtrl', ['$scope', '$uibModalInstance', function($scope, $uibModalInstance){
    var shortcutKeyVm = this;
    shortcutKeyVm.close = function () {
        $uibModalInstance.close();
    };
}]);
mainApp.controller('deleteExamCtrl', ['$scope', '$uibModalInstance', 'HomeService', 'exam', function($scope, $uibModalInstance, HomeService, exam){
    var deleteExamVm = this;
    deleteExamVm.examId = exam.id;
    deleteExamVm.type = exam.type;
    deleteExamVm.message = '';

    deleteExamVm.close = function () {
        if (deleteExamVm.deletingExam) return;

        $uibModalInstance.close(false);
    };

    deleteExamVm.changePassword = function () {
        deleteExamVm.message = '';
    };

    deleteExamVm.deletingExam = false;
    deleteExamVm.delete = function () {
        deleteExamVm.deletingExam = true;
        HomeService.deleteExam({id: deleteExamVm.examId}, {type: deleteExamVm.type}, function successCallback(response) {
            console.log(response);

            if (response.success) {
                $uibModalInstance.close(true);
            } else {
                deleteExamVm.message = response.message;
            }

            deleteExamVm.deletingExam = false;
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            deleteExamVm.deletingExam = false;
        });



    };
}]);
mainApp.controller('messageCtrl', ['$scope', '$uibModalInstance', 'data', function($scope, $uibModalInstance, data){
    var messageVm = this;
    messageVm.message = data.message;

    messageVm.close = function () {
        $uibModalInstance.close();
    };
}]);
mainApp.controller('shareExamCtrl', ['$scope', '$uibModalInstance', 'exam', 'ngClipboard', function($scope, $uibModalInstance, exam, ngClipboard){
    var shareExamVm = this;
    shareExamVm.examId = exam.id;
    shareExamVm.examLink = 'https://toithi.com/exam/' + exam.id + '/information';
    shareExamVm.message = '';

    shareExamVm.close = function() {
        $uibModalInstance.close();
    };

    shareExamVm.copyToClipboard = function () {
        ngClipboard.toClipboard(shareExamVm.examLink);
        shareExamVm.message = 'Liên kết đã sao chép vào clipboard';
    };
}]);
mainApp.controller('userHomeCtrl', ['$scope', '$window', '$timeout', '$uibModal', 'HomeService', function($scope, $window, $timeout, $uibModal, HomeService){

    var userHomeVm = this;
    userHomeVm.query = ''; //query string on header
    /**
     * search exam on header bar
     */
    userHomeVm.searchExam = function () {
        userHomeVm.query = userHomeVm.query.trim();
        if (userHomeVm.query.length === 0 ) return;

        $window.location.href = '/search?q=' + userHomeVm.query;
    };

    userHomeVm.yearView = false;
    userHomeVm.currentDay = -1;
    userHomeVm.currentMonth = -1;
    userHomeVm.currentYear = -1;
    userHomeVm.currentView = '';
    userHomeVm.normalCreationView = true;
    userHomeVm.searchCreationView = false;
    userHomeVm.normalActionView = true;
    userHomeVm.searchActionView = false;
    userHomeVm.examDeleteMonth = 0;
    userHomeVm.init = function (data) {
        userHomeVm.examDeleteMonth = data.examDeleteMonth;

        var now = new Date();
        userHomeVm.currentDay = now.getDate();
        userHomeVm.currentMonth = now.getMonth() + 1;
        userHomeVm.currentYear = now.getFullYear();
        userHomeVm.selectedMonth = userHomeVm.currentMonth;
        userHomeVm.selectedYear = userHomeVm.currentYear;
        userHomeVm.createMonthView();

        userHomeVm.currentView = 'creations';
        $timeout(userHomeVm.loadCreation, 0, true, 1);
        $timeout(userHomeVm.loadAction, 0, true, 1);

        userHomeVm.normalCreationView = true;
        userHomeVm.searchCreationView = false;
        userHomeVm.normalActionView = true;
        userHomeVm.searchActionView = false;

        $timeout(userHomeVm.loadExamsInMonth, 0, true, userHomeVm.currentMonth, userHomeVm.currentYear);
    };

    //<editor-fold desc="creation">
    userHomeVm.loadCreationService = null;
    userHomeVm.loadingCreation = false;
    userHomeVm.creations = [];
    userHomeVm.creationViewFrame = [];
    userHomeVm.creationPages = null;
    userHomeVm.currentCreationPage = 1;
    userHomeVm.previousCreationPage = false;
    userHomeVm.nextCreationPage = false;
    userHomeVm.lastCreationPage = 0;
    userHomeVm.totalCreation = 0;
    userHomeVm.loadCreation = function (page) {
        if (angular.isDefined(userHomeVm.creations[page])) {
            userHomeVm.creationViewFrame = userHomeVm.creations[page];
            userHomeVm.fromCreation = (page - 1) * 20 + 1;
            userHomeVm.toCreation = (page < userHomeVm.lastCreationPage) ? (page * 20) : userHomeVm.totalCreation;
            userHomeVm.currentCreationPage = page;
            userHomeVm.previousCreationPage = (page > 1);
            userHomeVm.nextCreationPage = (page < userHomeVm.lastCreationPage);
        } else {
            userHomeVm.loadingCreation = true;
            userHomeVm.loadCreationService = HomeService.loadCreation({page: page}, function successCallback(response) {
                console.log(response);
                if (response.success) {
                    if (userHomeVm.creationPages == null) {
                        userHomeVm.creationPages = [];
                        for (var i =0 ; i < response.result.last_page; i++) {
                            userHomeVm.creationPages.push(i+1);
                        }
                    }
                    userHomeVm.lastCreationPage = response.result.last_page;
                    userHomeVm.totalCreation = response.result.total;
                    userHomeVm.fromCreation = response.result.from;
                    userHomeVm.toCreation = response.result.to;
                    userHomeVm.currentCreationPage = response.result.current_page;
                    userHomeVm.previousCreationPage = (response.result.prev_page_url != null);
                    userHomeVm.nextCreationPage = (response.result.next_page_url != null);
                    userHomeVm.creations[userHomeVm.currentCreationPage] = response.result.data;
                    userHomeVm.creationViewFrame = userHomeVm.creations[userHomeVm.currentCreationPage];

                    // if (userHomeVm.actions.length == 0 && response.result.data.length > 0) {
                    //     userHomeVm.currentView = 'creations';
                    // }
                }

                userHomeVm.loadingCreation = false;
            }, function errorCallback(response) {
                console.log('error');
                console.log(response);
                userHomeVm.loadingCreation = false;
            });
        }
    };

    userHomeVm.goToCreationPage = function (page) {
        if (page >= 1 && page <= userHomeVm.lastCreationPage && page != userHomeVm.currentCreationPage) {
            userHomeVm.loadCreation(page);
        }
    };

    userHomeVm.goToPreviousCreationPage = function () {
        if (userHomeVm.currentCreationPage > 1) {
            userHomeVm.loadCreation(userHomeVm.currentCreationPage - 1);
        }
    };

    userHomeVm.goToNextCreationPage = function () {
        if (userHomeVm.currentCreationPage < userHomeVm.lastCreationPage) {
            userHomeVm.loadCreation(userHomeVm.currentCreationPage + 1);
        }
    };

    userHomeVm.displayNormalCreationView = function () {
        userHomeVm.normalCreationView = true;
        userHomeVm.searchCreationView = false;
        userHomeVm.currentCreationPage = 1;
        userHomeVm.loadCreation(userHomeVm.currentCreationPage);
        userHomeVm.creationQuery = '';
    };

    userHomeVm.creationSearchType = 'code';
    userHomeVm.searchingCreation = false;
    userHomeVm.searchCreationService = null;
    userHomeVm.searchCreationPages = null;
    userHomeVm.creationQuery = '';
    userHomeVm.searchCreation = function () {
        if (userHomeVm.creationQuery.length == 0) {
            userHomeVm.displayNormalCreationView();
            return;
        }
        if (userHomeVm.creationQuery.length < 1 || userHomeVm.creationQuery.length > 255) return;

        userHomeVm.normalCreationView = false;
        userHomeVm.searchCreationView = true;

        userHomeVm.searchCreationPages = null;
        userHomeVm.searchCreations = [];
        userHomeVm.loadSearchCreation(1);
    };

    userHomeVm.searchCreations = [];
    userHomeVm.searchCreationPages = null;
    userHomeVm.currentSearchCreationPage = 1;
    userHomeVm.previousSearchCreationPage = false;
    userHomeVm.nextSearchCreationPage = false;
    userHomeVm.lastSearchCreationPage = 0;
    userHomeVm.totalSearchCreation = 0;
    userHomeVm.loadSearchCreation = function (page) {
        if (angular.isDefined(userHomeVm.searchCreations[page])) {
            userHomeVm.creationViewFrame = userHomeVm.searchCreations[page];
            userHomeVm.currentSearchCreationPage = page;
            userHomeVm.previousSearchCreationPage = (page > 1);
            userHomeVm.nextSearchCreationPage = (page < userHomeVm.lastSearchCreationPage);
        } else {
            userHomeVm.searchingCreation = true;
            userHomeVm.searchCreationService = HomeService.searchCreation({query: userHomeVm.creationQuery, type: userHomeVm.creationSearchType, page: page}, function successCallback(response) {
                console.log('search');
                console.log(response);
                if (response.success) {
                    if (userHomeVm.searchCreationPages == null) {
                        userHomeVm.searchCreationPages = [];
                        for (var i =0 ; i < response.result.last_page; i++) {
                            userHomeVm.searchCreationPages.push(i+1);
                        }
                        //userHomeVm.creationPages = Array.from(Array(response.result.last_page),(x,i)=>i + 1);
                    }
                    userHomeVm.lastSearchCreationPage = response.result.last_page;
                    userHomeVm.totalSearchCreation = response.result.total;
                    userHomeVm.currentSearchCreationPage = response.result.current_page;
                    userHomeVm.previousSearchCreationPage = (response.result.prev_page_url != null);
                    userHomeVm.nextSearchCreationPage = (response.result.next_page_url != null);
                    userHomeVm.searchCreations[userHomeVm.currentSearchCreationPage] = response.result.data;
                    userHomeVm.creationViewFrame = userHomeVm.searchCreations[userHomeVm.currentSearchCreationPage];
                }

                userHomeVm.searchingCreation = false;
            }, function errorCallback(response) {
                console.log('error');
                console.log(response);
                userHomeVm.searchingCreation = false;
            });
        }
    };

    userHomeVm.goToSearchCreationPage = function (page) {
        if (page >= 1 && page <= userHomeVm.lastSearchCreationPage && page != userHomeVm.currentSearchCreationPage) {
            userHomeVm.loadSearchCreation(page);
        }
    };

    userHomeVm.goToPreviousSearchCreationPage = function () {
        if (userHomeVm.currentSearchCreationPage > 1) {
            userHomeVm.loadSearchCreation(userHomeVm.currentSearchCreationPage - 1);
        }
    };

    userHomeVm.goToNextSearchCreationPage = function () {
        if (userHomeVm.currentSearchCreationPage < userHomeVm.lastSearchCreationPage) {
            userHomeVm.loadSearchCreation(userHomeVm.currentSearchCreationPage + 1);
        }
    };

    //</editor-fold>

    //<editor-fold desc="action">
    userHomeVm.loadActionService = null;
    userHomeVm.loadingAction = false;
    userHomeVm.actions = [];
    userHomeVm.actionViewFrame = [];
    userHomeVm.actionPages = null;
    userHomeVm.currentActionPage = 1;
    userHomeVm.previousActionPage = false;
    userHomeVm.nextActionPage = false;
    userHomeVm.lastActionPage = 0;
    userHomeVm.totalAction = 0;
    userHomeVm.loadAction = function (page) {
        if (angular.isDefined(userHomeVm.actions[page])) {
            userHomeVm.actionViewFrame = userHomeVm.actions[page];
            userHomeVm.fromAction = (page - 1) * 20 + 1;
            userHomeVm.toAction = (page < userHomeVm.lastActionPage) ? (page * 20) : userHomeVm.totalAction;
            userHomeVm.currentActionPage = page;
            userHomeVm.previousActionPage = (page > 1);
            userHomeVm.nextActionPage = (page < userHomeVm.lastActionPage);
        } else {
            userHomeVm.loadingAction = true;
            userHomeVm.loadActionService = HomeService.loadAction({page: page}, function successCallback(response) {
                if (response.success) {
                    if (userHomeVm.actionPages == null) {
                        userHomeVm.actionPages = [];
                        for (var i =0 ; i < response.result.last_page; i++) {
                            userHomeVm.actionPages.push(i+1);
                        }
                        //userHomeVm.creationPages = Array.from(Array(response.result.last_page),(x,i)=>i + 1);
                        userHomeVm.lastActionPage = response.result.last_page;
                        userHomeVm.totalAction = response.result.total;
                    }
                    userHomeVm.fromAction = response.result.from;
                    userHomeVm.toAction = response.result.to;
                    userHomeVm.currentActionPage = response.result.current_page;
                    userHomeVm.previousActionPage = (response.result.prev_page_url != null);
                    userHomeVm.nextActionPage = (response.result.next_page_url != null);
                    userHomeVm.actions[userHomeVm.currentActionPage] = response.result.data;
                    userHomeVm.actionViewFrame = userHomeVm.actions[userHomeVm.currentActionPage];

                    if (userHomeVm.totalAction > userHomeVm.totalCreation) {
                        userHomeVm.currentView = 'actions';
                    }
                }

                userHomeVm.loadingAction = false;
            }, function errorCallback(response) {
                console.log('error');
                console.log(response);
                userHomeVm.loadingAction = false;
            });
        }
    };

    userHomeVm.goToActionPage = function (page) {
        if (page >= 1 && page <= userHomeVm.lastActionPage && page != userHomeVm.currentActionPage) {
            userHomeVm.loadAction(page);
        }
    };

    userHomeVm.goToPreviousActionPage = function () {
        if (userHomeVm.currentActionPage > 1) {
            userHomeVm.loadCreation(userHomeVm.currentActionPage - 1);
        }
    };

    userHomeVm.goToNextActionPage = function () {
        if (userHomeVm.currentActionPage < userHomeVm.lastActionPage) {
            userHomeVm.loadAction(userHomeVm.currentActionPage + 1);
        }
    };

    userHomeVm.displayNormalActionView = function () {
        userHomeVm.normalActionView = true;
        userHomeVm.searchActionView = false;
        userHomeVm.currentActionPage = 1;
        userHomeVm.loadAction(userHomeVm.currentActionPage);
        userHomeVm.actionQuery = '';
    };

    userHomeVm.actionSearchType = 'code';
    userHomeVm.searchingAction = false;
    userHomeVm.searchActionService = null;
    userHomeVm.searchActionPages = null;
    userHomeVm.actionQuery = '';
    userHomeVm.searchAction = function () {
        if (userHomeVm.actionQuery.length == 0) {
            userHomeVm.displayNormalActionView();
            return;
        }

        if (userHomeVm.actionQuery.length < 1 || userHomeVm.actionQuery.length > 255) return;

        userHomeVm.normalActionView = false;
        userHomeVm.searchActionView = true;

        userHomeVm.searchActionPages = null;
        userHomeVm.searchActions = [];
        userHomeVm.loadSearchAction(1);
    };

    userHomeVm.searchActions = [];
    userHomeVm.searchActionPages = null;
    userHomeVm.currentSearchActionPage = 1;
    userHomeVm.previousSearchActionPage = false;
    userHomeVm.nextSearchActionPage = false;
    userHomeVm.lastSearchActionPage = 0;
    userHomeVm.totalSearchAction = 0;
    userHomeVm.loadSearchAction = function (page) {
        if (angular.isDefined(userHomeVm.searchActions[page])) {
            userHomeVm.actionViewFrame = userHomeVm.searchActions[page];
            userHomeVm.currentSearchActionPage = page;
            userHomeVm.previousSearchActionPage = (page > 1);
            userHomeVm.nextSearchActionPage = (page < userHomeVm.lastSearchActionPage);
        } else {
            userHomeVm.searchingAction = true;
            userHomeVm.searchActionService = HomeService.searchAction({query: userHomeVm.actionQuery, type: userHomeVm.actionSearchType, page: page}, function successCallback(response) {
                if (response.success) {
                    if (userHomeVm.searchActionPages == null) {
                        userHomeVm.searchActionPages = [];
                        for (var i =0 ; i < response.result.last_page; i++) {
                            userHomeVm.searchActionPages.push(i+1);
                        }
                        //userHomeVm.creationPages = Array.from(Array(response.result.last_page),(x,i)=>i + 1);
                        userHomeVm.lastSearchActionPage = response.result.last_page;
                        userHomeVm.totalSearchAction = response.result.total;
                    }
                    userHomeVm.currentSearchActionPage = response.result.current_page;
                    userHomeVm.previousSearchActionPage = (response.result.prev_page_url != null);
                    userHomeVm.nextSearchActionPage = (response.result.next_page_url != null);
                    userHomeVm.searchActions[userHomeVm.currentSearchActionPage] = response.result.data;
                    userHomeVm.actionViewFrame = userHomeVm.searchActions[userHomeVm.currentSearchActionPage];
                }

                userHomeVm.searchingAction = false;
            }, function errorCallback(response) {
                console.log('error');
                console.log(response);
                userHomeVm.searchingAction = false;
            });
        }
    };

    userHomeVm.goToSearchActionPage = function (page) {
        if (page >= 1 && page <= userHomeVm.lastSearchActionPage && page != userHomeVm.currentSearchActionPage) {
            userHomeVm.loadSearchAction(page);
        }
    };

    userHomeVm.goToPreviousSearchActionPage = function () {
        if (userHomeVm.currentSearchActionPage > 1) {
            userHomeVm.loadSearchAction(userHomeVm.currentSearchActionPage - 1);
        }
    };

    userHomeVm.goToNextSearchActionPage = function () {
        if (userHomeVm.currentSearchActionPage < userHomeVm.lastSearchActionPage) {
            userHomeVm.loadSearchAction(userHomeVm.currentSearchActionPage + 1);
        }
    };

    userHomeVm.showCertificate = function (action) {
        if (action.pivot.finished) {
            $window.location.href = '/u/exam/' + action.id + '/dashboard/certificate';
        } else {
            $uibModal.open({
                animation: true,
                templateUrl: 'messageModal.html',
                controller: 'messageCtrl',
                controllerAs: 'messageVm',
                keyboard: true,
                resolve: {
                    data: function () {
                        return {
                            message: 'Bài thi chưa được hoàn thành.'
                        }
                    }
                }
            });
        }
    };

    //</editor-fold>

    //<editor-fold desc="exams in month">
    userHomeVm.loadingInMonth = false;
    userHomeVm.loadExamsInMonthService = null;
    userHomeVm.examsInMonth = {};
    userHomeVm.loadExamsInMonth = function (month, year) {
        if (angular.isDefined(userHomeVm.examsInMonth[month + '-' + year])) {
            userHomeVm.createMonthView();
            userHomeVm.createEventView();
        } else {
            userHomeVm.eventsInMonthView = [];
            userHomeVm.loadingInMonth = true;
            userHomeVm.loadExamsInMonthService = HomeService.loadExamsInMonth({month: month, year: year}, function successCallback(response) {
                console.log('event in month');
                console.log(response);
                if (response.success) {
                    var my = month + '-' + year;
                    if (angular.isDefined(userHomeVm.examsInMonth[my])) {
                        return;
                    }

                    userHomeVm.examsInMonth[my] = {};

                    var nCreation = response.result.creations.length;
                    for (var i=0; i < nCreation; i++) {
                        var creation = response.result.creations[i];
                        //var start = moment(creation, 'YYYY-MM-DD H:m:s').toDate();new Date(creation.start);

                        var creationItem = {
                            id: creation.id,
                            code: creation.code,
                            title: creation.title,
                            start: creation.start,
                            end: creation.end,
                            number_players: creation.number_players
                        };

                        var startDateOfMonth = moment(creation.start, 'YYYY-MM-DD H:m:s').date();
                        if (angular.isUndefined(userHomeVm.examsInMonth[my][startDateOfMonth])) {
                            userHomeVm.examsInMonth[my][startDateOfMonth] = {
                                creations: []
                            };
                        }

                        if (angular.isUndefined(userHomeVm.examsInMonth[my][startDateOfMonth]['creations'])) {
                            userHomeVm.examsInMonth[my][startDateOfMonth]['creations'] = [];
                        }

                        userHomeVm.examsInMonth[my][startDateOfMonth]['creations'].push(creationItem);
                    }

                    var nAction = response.result.actions.length;
                    for (i=0; i < nAction; i++) {
                        var action = response.result.actions[i];
                        //var begin = new Date(action.pivot.begin_time);

                        var actionItem = {
                            id: action.id,
                            code: action.code,
                            title: action.title,
                            pivot: {
                                begin_time: action.pivot.begin_time,
                                finished: action.pivot.finished,
                                score: action.pivot.score,
                                consumed_time: action.pivot.consumed_time,
                                number_correct: action.pivot.number_correct
                            }
                        };

                        var beginDateOfMonth = moment(action.pivot.begin_time, 'YYYY-MM-DD H:m:s').date();

                        if (angular.isUndefined(userHomeVm.examsInMonth[my][beginDateOfMonth])) {
                            userHomeVm.examsInMonth[my][beginDateOfMonth] = {
                                actions: []
                            };
                        }

                        if (angular.isUndefined(userHomeVm.examsInMonth[my][beginDateOfMonth]['actions'])) {
                            userHomeVm.examsInMonth[my][beginDateOfMonth]['actions'] = [];
                        }

                        userHomeVm.examsInMonth[my][beginDateOfMonth]['actions'].push(actionItem);
                    }

                    console.log('exams in month');
                    console.log(userHomeVm.examsInMonth);
                    userHomeVm.createMonthView();
                    userHomeVm.createEventView();
                }

                userHomeVm.loadingInMonth = false;
            }, function errorCallback(response) {
                console.log('error');
                console.log(response);
                userHomeVm.loadingInMonth = false;
            });
        }
    };

    userHomeVm.selectedDay = -1;
    userHomeVm.selectedMonth = -1;
    userHomeVm.selectedYear = -1;
    userHomeVm.changeMonth = function (month) {
        userHomeVm.selectedMonth = month;

        userHomeVm.yearView = false;
        userHomeVm.createMonthView();

        userHomeVm.loadExamsInMonth(userHomeVm.selectedMonth, userHomeVm.selectedYear);
    };

    userHomeVm.monthRows = [];
    userHomeVm.eventsInMonth = [];
    userHomeVm.createMonthView = function () {
        userHomeVm.monthRows = [];
        userHomeVm.eventsInMonth = [];
        var firstDate = new Date(userHomeVm.selectedYear, userHomeVm.selectedMonth - 1, 1);
        var lastDate = new Date(userHomeVm.selectedYear, userHomeVm.selectedMonth, 0);
        var firstDayInWeek = firstDate.getDay();
        var lastDayInWeek = lastDate.getDay();
        var numDayInMonth = lastDate.getDate();
        var n = firstDayInWeek +  numDayInMonth + (6 - lastDayInWeek);

        var my = userHomeVm.selectedMonth + '-' + userHomeVm.selectedYear;
        var day = 1;
        var monthRow = [];
        for(var i = 0; i < n; i++) {
            var dayCell = {
                id: i + 1,
                value: '',
                existCreation: false,
                existAction: false
            };
            if (i >= firstDayInWeek && day <= numDayInMonth) {
                dayCell.value = day;

                dayCell.existCreation = angular.isDefined(userHomeVm.examsInMonth[my]) && angular.isDefined(userHomeVm.examsInMonth[my][day])
                        && angular.isDefined(userHomeVm.examsInMonth[my][day]['creations']);
                dayCell.existAction = angular.isDefined(userHomeVm.examsInMonth[my]) && angular.isDefined(userHomeVm.examsInMonth[my][day])
                    && angular.isDefined(userHomeVm.examsInMonth[my][day]['actions']);

                var event;
                if (dayCell.existCreation) {
                    var nCreation = userHomeVm.examsInMonth[my][day]['creations'].length;
                    for(var j=0; j < nCreation; j++) {
                        event = userHomeVm.examsInMonth[my][day]['creations'][j];
                        event.day = day;
                        //event.date = new Date(event.start); //for sorting in filter
                        event.date = moment(event.start, 'YYYY-MM-DD H:m:s').toDate(); //for sorting in filter
                        event.type = 'creation';

                        userHomeVm.eventsInMonth.push(event);
                    }
                }

                if (dayCell.existAction) {
                    var nAction = userHomeVm.examsInMonth[my][day]['actions'].length;
                    for(var k=0; k < nAction; k++) {
                        event = userHomeVm.examsInMonth[my][day]['actions'][k];
                        event.day = day;
                        //event.date = new Date(event.pivot.begin_time); //for sorting in filter
                        event.date = moment(event.pivot.begin_time, 'YYYY-MM-DD H:m:s').toDate(); //for sorting in filter
                        event.type = 'action';

                        userHomeVm.eventsInMonth.push(event);
                    }
                }

                day++;
            }

            if (i != 0 && i % 7 == 0) {
                userHomeVm.monthRows.push(monthRow);
                monthRow = [];
            }
            monthRow.push(dayCell);
        }
        userHomeVm.monthRows.push(monthRow);

        userHomeVm.eventsInMonth.sort(function(a, b){
            // Compare the 2 dates
            if(a.date > b.date) return -1;
            if(a.date < b.date) return 1;
            return 0;
        });

    };

    userHomeVm.changeCalendarView = function () {
        userHomeVm.yearView = true;
    };

    userHomeVm.goCalendarPrevious = function () {
        if (userHomeVm.yearView) {
            if (userHomeVm.selectedYear > 2000) {
                userHomeVm.selectedYear--;
            }
        } else {
            if (userHomeVm.selectedMonth > 1) {
                userHomeVm.changeMonth(userHomeVm.selectedMonth - 1);
            } else {
                if (userHomeVm.selectedYear > 2000) {
                    userHomeVm.selectedYear--;
                    userHomeVm.changeMonth(12);
                }
            }
        }
    };

    userHomeVm.goCalendarNext = function () {
        if (userHomeVm.yearView) {
            if (userHomeVm.selectedYear < 2100) {
                userHomeVm.selectedYear++;
            }
        } else {
            if (userHomeVm.selectedMonth < 12) {
                userHomeVm.changeMonth(userHomeVm.selectedMonth + 1);
            } else {
                if (userHomeVm.selectedYear < 2100) {
                    userHomeVm.selectedYear++;
                    userHomeVm.changeMonth(1);
                }
            }
        }
    };

    userHomeVm.checkCurrentDay = function(day) {
        return (userHomeVm.currentDay == day && userHomeVm.selectedMonth == userHomeVm.currentMonth
            && userHomeVm.selectedYear == userHomeVm.currentYear);
    };

    userHomeVm.checkCurrentMonth = function (month) {
        return (userHomeVm.currentMonth == month && userHomeVm.selectedYear == userHomeVm.currentYear);
    };

    userHomeVm.eventsInMonthView = [];
    userHomeVm.eventsInMonthPage = 0;
    userHomeVm.lastEventsInMonthPage = 0;
    userHomeVm.createEventView = function () {
        userHomeVm.eventsInMonthPage = 0;
        userHomeVm.lastEventsInMonthPage = Math.floor((userHomeVm.eventsInMonth.length - 1) / 5);
        userHomeVm.eventsInMonthView = userHomeVm.eventsInMonth.slice(userHomeVm.eventsInMonthPage * 5, (userHomeVm.eventsInMonthPage + 1) * 5);
    };

    userHomeVm.nextEventView = function () {
        if (userHomeVm.eventsInMonthPage == userHomeVm.lastEventsInMonthPage) return;

        userHomeVm.eventsInMonthPage++;
        userHomeVm.eventsInMonthView = userHomeVm.eventsInMonth.slice(userHomeVm.eventsInMonthPage * 5, (userHomeVm.eventsInMonthPage + 1) * 5);
    };

    userHomeVm.previousEventView = function () {
        if (userHomeVm.eventsInMonthPage == 0) return;

        userHomeVm.eventsInMonthPage--;
        userHomeVm.eventsInMonthView = userHomeVm.eventsInMonth.slice(userHomeVm.eventsInMonthPage * 5, (userHomeVm.eventsInMonthPage + 1) * 5);
    };

    userHomeVm.showEvent = function (event) {
        if (event.type == 'creation') {
            userHomeVm.normalCreationView = false;
            userHomeVm.searchCreationView = false;

            userHomeVm.creationViewFrame = [];
            userHomeVm.creationViewFrame.push(event);

            userHomeVm.currentView = 'creations';
        } else {
            userHomeVm.normalActionView = false;
            userHomeVm.searchActionView = false;

            userHomeVm.actionViewFrame = [];
            userHomeVm.actionViewFrame.push(event);

            userHomeVm.currentView = 'actions';
        }

        //scroll to top
        $window.scrollTo(0, 0);
    };

    userHomeVm.showEventsInDay = function (dayCell) {
        if (dayCell.value == '') return;

        userHomeVm.normalCreationView = false;
        userHomeVm.searchCreationView = false;

        userHomeVm.normalActionView = false;
        userHomeVm.searchActionView = false;

        var my = userHomeVm.selectedMonth + '-' + userHomeVm.selectedYear;
        var day = dayCell.value;

        if (dayCell.existCreation) {
            userHomeVm.creationViewFrame = userHomeVm.examsInMonth[my][day]['creations'];
            userHomeVm.currentView = 'creations';
        }

        if (dayCell.existAction) {
            userHomeVm.actionViewFrame = userHomeVm.examsInMonth[my][day]['actions'];
            userHomeVm.currentView = 'actions';
        }

        //scroll to top
        $window.scrollTo(0, 0);
    };
    //</editor-fold>

    userHomeVm.changeTab = function (tabLabel) {
        userHomeVm.currentView = tabLabel;
    };

    userHomeVm.shareExam = function (examId) {
        $uibModal.open({
            animation: true,
            templateUrl: 'shareExamModal.html',
            controller: 'shareExamCtrl',
            controllerAs: 'shareExamVm',
            keyboard: true,
            resolve: {
                exam: function () {
                    return {
                        id: examId
                    }
                }
            }
        });
    };

    userHomeVm.deleteCreation = function (examId) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'deleteExamModal.html',
            controller: 'deleteExamCtrl',
            controllerAs: 'deleteExamVm',
            keyboard: false,
            backdrop: 'static',
            resolve: {
                exam: function () {
                    return {
                        id: examId,
                        type: 'creation'

                    }
                }
            }
        });

        modalInstance.result.then(function (success){
            //page:
            if (success) {
                //remove exam in creations list
                var nCreationPage = userHomeVm.creations.length;
                var i,j, nCreation;
                for (i = 1; i < nCreationPage; i++) {
                    if (angular.isDefined(userHomeVm.creations[i])) {
                        nCreation = userHomeVm.creations[i].length;
                        for (j=0; j < nCreation; j++) {
                            if (userHomeVm.creations[i][j].id == examId) {
                                userHomeVm.creations[i].splice(j, 1);
                                userHomeVm.totalCreation--;
                                break;
                            }
                        }

                        if (j != nCreation) {
                            if (angular.isDefined(userHomeVm.creations[i + 1])) {
                                userHomeVm.creations[i].push(userHomeVm.creations[i+1][0]);
                                if (userHomeVm.normalCreationView) {
                                    userHomeVm.creationViewFrame = userHomeVm.creations[i];
                                }
                            } else {
                                userHomeVm.loadCreationService = HomeService.loadCreation({page: i}, function successCallback(response) {
                                    if (response.success) {
                                        if (response.result.last_page != userHomeVm.lastCreationPage) {
                                            userHomeVm.creationPages = [];
                                            for (var k =0 ; k < response.result.last_page; k++) {
                                                userHomeVm.creationPages.push(k+1);
                                            }
                                        }
                                        userHomeVm.lastCreationPage = response.result.last_page;
                                        userHomeVm.totalCreation = response.result.total;
                                        if (response.result.current_page <= response.result.last_page) {
                                            userHomeVm.fromCreation = response.result.from;
                                            userHomeVm.toCreation = response.result.to;
                                            userHomeVm.currentCreationPage = response.result.current_page;
                                            userHomeVm.previousCreationPage = (response.result.prev_page_url != null);
                                            userHomeVm.nextCreationPage = (response.result.next_page_url != null);
                                            userHomeVm.creations[userHomeVm.currentCreationPage] = response.result.data;
                                            if (userHomeVm.normalCreationView) {
                                                userHomeVm.creationViewFrame = userHomeVm.creations[userHomeVm.currentCreationPage];
                                            }
                                        } else {
                                            userHomeVm.creations.splice(response.result.current_page, 1);
                                            if (angular.isDefined(userHomeVm.creations[response.result.last_page])) {
                                                userHomeVm.fromCreation = (response.result.last_page - 1) * 20 + 1;
                                                userHomeVm.toCreation = userHomeVm.totalCreation;
                                                userHomeVm.currentCreationPage = response.result.last_page;
                                                userHomeVm.previousCreationPage = (response.result.prev_page_url != null);
                                                userHomeVm.nextCreationPage = false;
                                                if (userHomeVm.normalCreationView) {
                                                    userHomeVm.creationViewFrame = userHomeVm.creations[userHomeVm.currentCreationPage];
                                                }
                                            } else {
                                                userHomeVm.loadCreation(response.result.last_page);
                                            }
                                        }
                                    }

                                }, function errorCallback(response) {
                                    console.log('error');
                                    console.log(response);
                                });
                            }
                            userHomeVm.creations.splice(i + 1, nCreationPage - i + 1);
                            break;
                        }
                    }
                }

                //remove exam in search creation view frame
                if (userHomeVm.searchCreationView) {
                    nCreationPage = userHomeVm.searchCreations.length;
                    for (i = 1; i < nCreationPage; i++) {
                        if (angular.isDefined(userHomeVm.searchCreations[i])) {
                            nCreation = userHomeVm.searchCreations[i].length;
                            for (j = 0; j < nCreation; j++) {
                                if (userHomeVm.searchCreations[i][j].id == examId) {
                                    userHomeVm.searchCreations[i].splice(j, 1);
                                    break;
                                }
                            }

                            if (j != nCreation) {
                                if (angular.isDefined(userHomeVm.searchCreations[i + 1])) {
                                    userHomeVm.searchCreations[i].push(userHomeVm.searchCreations[i + 1][0]);
                                    userHomeVm.creationViewFrame = userHomeVm.searchCreations[i];
                                } else {
                                    userHomeVm.searchCreationService = HomeService.searchCreation({
                                        query: userHomeVm.creationQuery,
                                        type: userHomeVm.creationSearchType,
                                        page: i
                                    }, function successCallback(response) {
                                        if (response.success) {
                                            if (response.result.last_page != userHomeVm.lastSearchCreationPage) {
                                                userHomeVm.searchCreationPages = [];
                                                for (var k = 0; k < response.result.last_page; k++) {
                                                    userHomeVm.searchCreationPages.push(k + 1);
                                                }
                                            }

                                            userHomeVm.lastSearchCreationPage = response.result.last_page;
                                            userHomeVm.totalSearchCreation = response.result.total;

                                            if (response.result.current_page <= response.result.last_page) {
                                                userHomeVm.currentSearchCreationPage = response.result.current_page;
                                                userHomeVm.previousSearchCreationPage = (response.result.prev_page_url != null);
                                                userHomeVm.nextSearchCreationPage = (response.result.next_page_url != null);
                                                userHomeVm.searchCreations[userHomeVm.currentSearchCreationPage] = response.result.data;
                                                userHomeVm.creationViewFrame = userHomeVm.searchCreations[userHomeVm.currentSearchCreationPage];
                                            } else {
                                                userHomeVm.searchCreations.splice(response.result.current_page, 1);
                                                if (angular.isDefined(userHomeVm.creations[response.result.last_page])) {
                                                    userHomeVm.currentSearchCreationPage = response.result.last_page;
                                                    userHomeVm.previousSearchCreationPage = (response.result.prev_page_url != null);
                                                    userHomeVm.nextSearchCreationPage = false;
                                                    userHomeVm.creationViewFrame = userHomeVm.searchCreations[userHomeVm.currentSearchCreationPage];
                                                } else {
                                                    userHomeVm.loadSearchCreation(response.result.last_page);
                                                }
                                            }
                                        }

                                    }, function errorCallback(response) {
                                        console.log('error');
                                        console.log(response);
                                    });
                                }
                                userHomeVm.searchCreations.splice(i + 1, nCreationPage - i + 1);
                                break;
                            }
                        }

                    }
                }

                //remove creation exam in eventsInMonth
                for (var my in userHomeVm.examsInMonth) {
                    // skip loop if the property is from prototype
                    if (!userHomeVm.examsInMonth.hasOwnProperty(my)) continue;

                    var eventsInDay = userHomeVm.examsInMonth[my];
                    for (var day in eventsInDay) {
                        // skip loop if the property is from prototype
                        if(!eventsInDay.hasOwnProperty(day)) continue;

                        if (angular.isDefined(eventsInDay[day]['creations'])) {
                            nCreation = eventsInDay[day]['creations'].length;
                            for(i = 0; i < nCreation; i++) {
                                if (eventsInDay[day]['creations'][i].id == examId) {
                                    userHomeVm.examsInMonth[my][day]['creations'].splice(i, 1);
                                    if (userHomeVm.examsInMonth[my][day]['creations'].length == 0) {
                                        delete userHomeVm.examsInMonth[my][day]['creations'];
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }

                userHomeVm.createMonthView();
                userHomeVm.createEventView();
            }
        });
    };

    userHomeVm.deleteAction = function (action) {
        var actionBeginTime = moment(action.pivot.begin_time, 'YYYY-MM-DD H:m:s');
        var diffMonths = moment().diff(actionBeginTime, 'months', true);
        if (diffMonths >= userHomeVm.examDeleteMonth) {
            var examId = action.id;
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'deleteExamModal.html',
                controller: 'deleteExamCtrl',
                controllerAs: 'deleteExamVm',
                keyboard: false,
                backdrop: 'static',
                resolve: {
                    exam: function () {
                        return {
                            id: examId,
                            type: 'action'
                        }
                    }
                }
            });

            modalInstance.result.then(function (success){
                //page:
                if (success) {
                    //remove exam in actions list
                    var nActionPage = userHomeVm.actions.length;
                    var i,j, nAction;
                    for (i = 1; i < nActionPage; i++) {
                        if (angular.isDefined(userHomeVm.actions[i])) {
                            nAction = userHomeVm.actions[i].length;
                            for (j=0; j < nAction; j++) {
                                if (userHomeVm.actions[i][j].id == examId) {
                                    userHomeVm.actions[i].splice(j, 1);
                                    userHomeVm.totalAction--;
                                    break;
                                }
                            }

                            if (j != nAction) {
                                if (angular.isDefined(userHomeVm.actions[i + 1])) {
                                    userHomeVm.actions[i].push(userHomeVm.actions[i+1][0]);
                                    if (userHomeVm.normalActionView) {
                                        userHomeVm.actionViewFrame = userHomeVm.actions[i];
                                    }
                                } else {
                                    userHomeVm.loadActionService = HomeService.loadAction({page: i}, function successCallback(response) {
                                        if (response.success) {
                                            if (response.result.last_page != userHomeVm.lastActionPage) {
                                                userHomeVm.actionPages = [];
                                                for (var k =0 ; k < response.result.last_page; k++) {
                                                    userHomeVm.actionPages.push(k+1);
                                                }
                                            }
                                            userHomeVm.lastActionPage = response.result.last_page;
                                            userHomeVm.totalAction = response.result.total;
                                            if (response.result.current_page <= response.result.last_page) {
                                                userHomeVm.fromAction = response.result.from;
                                                userHomeVm.toAction = response.result.to;
                                                userHomeVm.currentActionPage = response.result.current_page;
                                                userHomeVm.previousActionPage = (response.result.prev_page_url != null);
                                                userHomeVm.nextActionPage = (response.result.next_page_url != null);
                                                userHomeVm.actions[userHomeVm.currentActionPage] = response.result.data;
                                                if (userHomeVm.normalActionView) {
                                                    userHomeVm.actionViewFrame = userHomeVm.actions[userHomeVm.currentActionPage];
                                                }
                                            } else {
                                                userHomeVm.actions.splice(response.result.current_page, 1);
                                                if (angular.isDefined(userHomeVm.actions[response.result.last_page])) {
                                                    userHomeVm.fromAction = (response.result.last_page - 1) * 20 + 1;
                                                    userHomeVm.toAction = userHomeVm.totalAction;
                                                    userHomeVm.currentActionPage = response.result.last_page;
                                                    userHomeVm.previousActionPage = (response.result.prev_page_url != null);
                                                    userHomeVm.nextActionPage = false;
                                                    if (userHomeVm.normalActionView) {
                                                        userHomeVm.actionViewFrame = userHomeVm.actions[userHomeVm.currentActionPage];
                                                    }
                                                } else {
                                                    userHomeVm.loadAction(response.result.last_page);
                                                }
                                            }
                                        }

                                    }, function errorCallback(response) {
                                        console.log('error');
                                        console.log(response);
                                    });
                                }
                                userHomeVm.actions.splice(i + 1, nActionPage - i + 1);
                                break;
                            }
                        }
                    }

                    //remove exam in search action view frame
                    if (userHomeVm.searchActionView) {
                        nActionPage = userHomeVm.searchActions.length;
                        for (i = 1; i < nActionPage; i++) {
                            if (angular.isDefined(userHomeVm.searchActions[i])) {
                                nAction = userHomeVm.searchActions[i].length;
                                for (j = 0; j < nAction; j++) {
                                    if (userHomeVm.searchActions[i][j].id == examId) {
                                        userHomeVm.searchActions[i].splice(j, 1);
                                        break;
                                    }
                                }

                                if (j != nAction) {
                                    if (angular.isDefined(userHomeVm.searchActions[i + 1])) {
                                        userHomeVm.searchActions[i].push(userHomeVm.searchActions[i + 1][0]);
                                        userHomeVm.actionViewFrame = userHomeVm.searchActions[i];
                                    } else {
                                        userHomeVm.searchActionService = HomeService.searchAction({
                                            query: userHomeVm.actionQuery,
                                            type: userHomeVm.actionSearchType,
                                            page: i
                                        }, function successCallback(response) {
                                            if (response.success) {
                                                if (response.result.last_page != userHomeVm.lastSearchActionPage) {
                                                    userHomeVm.searchActionPages = [];
                                                    for (var k = 0; k < response.result.last_page; k++) {
                                                        userHomeVm.searchActionPages.push(k + 1);
                                                    }
                                                }

                                                userHomeVm.lastSearchActionPage = response.result.last_page;
                                                userHomeVm.totalSearchAction = response.result.total;

                                                if (response.result.current_page <= response.result.last_page) {
                                                    userHomeVm.currentSearchActionPage = response.result.current_page;
                                                    userHomeVm.previousSearchActionPage = (response.result.prev_page_url != null);
                                                    userHomeVm.nextSearchActionPage = (response.result.next_page_url != null);
                                                    userHomeVm.searchActions[userHomeVm.currentSearchActionPage] = response.result.data;
                                                    userHomeVm.actionViewFrame = userHomeVm.searchActions[userHomeVm.currentSearchActionPage];
                                                } else {
                                                    userHomeVm.searchActions.splice(response.result.current_page, 1);
                                                    if (angular.isDefined(userHomeVm.actions[response.result.last_page])) {
                                                        userHomeVm.currentSearchActionPage = response.result.last_page;
                                                        userHomeVm.previousSearchActionPage = (response.result.prev_page_url != null);
                                                        userHomeVm.nextSearchActionPage = false;
                                                        userHomeVm.actionViewFrame = userHomeVm.searchActions[userHomeVm.currentSearchActionPage];
                                                    } else {
                                                        userHomeVm.loadSearchAction(response.result.last_page);
                                                    }
                                                }
                                            }

                                        }, function errorCallback(response) {
                                            console.log('error');
                                            console.log(response);
                                        });
                                    }
                                    userHomeVm.searchActions.splice(i + 1, nActionPage - i + 1);
                                    break;
                                }
                            }
                        }
                    }

                    //remove action exam in eventsInMonth
                    for (var my in userHomeVm.examsInMonth) {
                        // skip loop if the property is from prototype
                        if (!userHomeVm.examsInMonth.hasOwnProperty(my)) continue;

                        var eventsInDay = userHomeVm.examsInMonth[my];
                        for (var day in eventsInDay) {
                            // skip loop if the property is from prototype
                            if(!eventsInDay.hasOwnProperty(day)) continue;

                            if (angular.isDefined(eventsInDay[day]['actions'])) {
                                nAction = eventsInDay[day]['actions'].length;
                                for(i = 0; i < nAction; i++) {
                                    if (eventsInDay[day]['actions'][i].id == examId) {
                                        userHomeVm.examsInMonth[my][day]['actions'].splice(i, 1);
                                        if (userHomeVm.examsInMonth[my][day]['actions'].length == 0) {
                                            delete userHomeVm.examsInMonth[my][day]['actions'];
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    userHomeVm.createMonthView();
                    userHomeVm.createEventView();
                }
            });
        }
        else {
            $uibModal.open({
                animation: true,
                templateUrl: 'messageModal.html',
                controller: 'messageCtrl',
                controllerAs: 'messageVm',
                keyboard: true,
                resolve: {
                    data: function () {
                        return {
                            message: 'Bài làm chỉ được xóa sau ' + userHomeVm.examDeleteMonth + ' tháng.'
                        }
                    }
                }
            });
        }
    };

    $scope.$on('$locationChangeSuccess', function (event, current, previous) {
        //compare after remove hash
        if (current.split('#')[0] == previous.split('#')[0]) return;

        if (userHomeVm.loadCreationService != null) {
            userHomeVm.loadCreationService.$cancelRequest();
        }

        if (userHomeVm.searchCreationService != null) {
            userHomeVm.searchCreationService.$cancelRequest();
        }

        if (userHomeVm.loadActionService != null) {
            userHomeVm.loadActionService.$cancelRequest();
        }

        if (userHomeVm.searchActionService != null) {
            userHomeVm.searchActionService.$cancelRequest();
        }

        if (userHomeVm.loadExamsInMonthService != null) {
            userHomeVm.loadExamsInMonthService.$cancelRequest();
        }
    });
}]);
mainApp.controller('examImageUploadCtrl', ['$scope', '$timeout', 'Upload', function($scope, $timeout, Upload){
    //This control use for image uploading window in tinymce editor feature
    var imageVm = this;

    imageVm.uploadMessage = ''; //display upload's message such as success, error,...
    imageVm.imageUrl = null;    //uploaded image url

    imageVm.init = function (data) {
        imageVm.examId = data.examId;
    };

    imageVm.uploading = false;  //flag to display animation
    imageVm.progressImageUpload = 0;    //for display upload progress bar
    /**
     * upload image to server by ng-file-upload module
     * @param file
     */
    imageVm.upload = function(file) {
        if (file && !file.$error) {
            imageVm.progressImageUpload = 0;
            imageVm.uploadMessage = 'File đang gửi đi...';
            imageVm.uploading = true;

            Upload.upload({
                url: '/u/image/exam/' + imageVm.examId,
                data: {image: file}
            }).then(function successCallback(resp) {
                imageVm.imageUrl = '/image/' + resp.data.imageName;
                imageVm.uploadMessage = 'File đã gửi thành công.';
                imageVm.progressImageUpload = 95;
                $timeout(function(){
                    imageVm.uploading = false;
                    imageVm.uploadMessage = '';
                    imageVm.progressImageUpload = 100;
                }, 2000);
            }, function errorCallback(resp) {
                imageVm.uploading = false;
                $timeout(function() {
                    imageVm.uploadMessage = 'Gặp lỗi trong quá trình gửi, vui lòng thử lại.';
                }, 3000);
            }, function progressCallback(evt) {
                imageVm.progressImageUpload = parseInt(90.0 * evt.loaded / evt.total);
            });
        } else {
            if (file && file.$error) {
                imageVm.uploadMessage = 'File bị lỗi hoặc file không đúng định dạng.';
            }
        }
    };

    /**
     * send image url to previous window (pop-up button in tinymce editor)
     */
    imageVm.insertImage = function () {
        if (imageVm.imageUrl != null) {
            top.tinymce.activeEditor.windowManager.getParams().oninsert(imageVm.imageUrl);
        }
        top.tinymce.activeEditor.windowManager.close();
    };

    /**
     * cancel uploading new image to server
     */
    imageVm.cancel = function () {
        top.tinymce.activeEditor.windowManager.close();
    };

}]);
mainApp.controller('mathtypeCtrl',['$scope', '$sce', '$document', function($scope, $sce, $document){
    //This control used in math type editor in tinymce editor

    MathJax.Hub.Queue(["setRenderer", MathJax.Hub, "CommonHTML"]); //set mathjax type

    /**
     * exit mathtype window when press ESC key
     */
    $document.on('keydown', function(e){
        if (e.key == 'Escape' || e.key == 'Esc') {
            top.tinymce.activeEditor.windowManager.close();
        }
    });

    var mathtypeVm = this;

    mathtypeVm.equation = "";   //variable to store equation
    mathtypeVm.blockDisplay = false;    //equation display type (inline or block)

    mathtypeVm.mathEditorElm = $('#mathEditor');    //find math editor element
    mathtypeVm.mathEditorElm.focus();               //focus to editor when display window

    /**
     * insert equation which user choose on menu bar to editor area
     * @param tex
     */
    mathtypeVm.insertEquation = function(tex) {
        var range, sel = rangy.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);

            var rangeAncestor = range.commonAncestorContainer;
            //only insert in math editor
            var selectedMathEditorElm = $(rangeAncestor).closest('#mathEditor');
            if (selectedMathEditorElm.length == 0) {
                mathtypeVm.mathEditorElm.focus();
                //move caret to end of div
                sel = rangy.getSelection();
                sel.selectAllChildren(mathtypeVm.mathEditorElm[0]);
                sel.collapseToEnd();
                range = sel.getRangeAt(0);
            }

            //create node from tex string which want to insert to current math string
            var textNode = document.createTextNode(tex + ' ');
            range.deleteContents();
            range.insertNode(textNode);

            //set the caret after the node for this range
            range.setStart(textNode, textNode.length);
            range.setEnd(textNode,textNode.length);

            //apply this range to the selection object
            sel.removeAllRanges();
            sel.addRange(range);

            mathtypeVm.mathEditorElm.change();
        }
    };

    /**
     * list of group symbol
     * @type {*[]}
     */
    mathtypeVm.symbolGroupList = [
        {
            id: '1',
            name: 'Kí hiệu cơ bản',
            symbolArr: [
                { code: '&plusmn;', tex: '\\pm'},
                { code: '&times;', tex: '\\times'},
                { code: '&divide;', tex: '\\div'},
                { code: '&ne;', tex: '\\neq'},
                { code: '&sim;', tex: '\\sim'},
                { code: '&asymp;', tex: '\\approx'},
                { code: '&equiv;', tex: '\\equiv'},
                { code: '&#x221D;', tex: '\\propto'},
                { code: '&infin;', tex: '\\infty'},
                { code: '&ge;', tex: '\\geq'},
                { code: '&le;', tex: '\\leq'},
                { code: '&forall;', tex: '\\forall'},
                { code: '&exist;', tex: '\\exists'},
                { code: '&#x2204;', tex: '\\nexists'},
                { code: '&isin;', tex: '\\in'},
                { code: '&ni;', tex: '\\ni'},
                { code: '&notin;', tex: '\\notin'},
                { code: '&cup;', tex: '\\cup'},
                { code: '&cap;', tex: '\\cap'},
                { code: '&sub;', tex: '\\subset'},
                { code: '&sup;', tex: '\\supset'},
                { code: '&nsub;', tex: '\\not\\subset'},
                { code: '&empty;', tex: '\\emptyset'},
                { code: '&#x2190;', tex: '\\rightarrow'},
                { code: '&#x2191;', tex: '\\uparrow'},
                { code: '&#x2192;', tex: '\\leftarrow'},
                { code: '&#x2193;', tex: '\\downarrow'},
                { code: '&#x2194;', tex: '\\leftrightarrow'},
                { code: '&#x21D0;', tex: '\\Rightarrow'},
                { code: '&#x21D2;', tex: '\\Leftarrow'},
                { code: '&#x21D4;', tex: '\\Leftrightarrow'},
                { code: '&#x226B;', tex: '\\gg'},
                { code: '&#x226A;', tex: '\\ll'},
                { code: '&#x03B1;', tex: '\\alpha'},
                { code: '&#x03B2;', tex: '\\beta'},
                { code: '&#x03B3;', tex: '\\gamma'},
                { code: '&#x03B4;', tex: '\\delta'},
                { code: '&#x03B5;', tex: '\\varepsilon'},
                { code: '&#x03B8;', tex: '\\theta'},
                { code: '&#x03D1;', tex: '\\vartheta'},
                { code: '&#x00B5;', tex: '\\mu'},
                { code: '&#x03C0;', tex: '\\pi'},
                { code: '&#x03C6;', tex: '\\varphi'},
                { code: '&#x03C9;', tex: '\\omega'},
                { code: '&#x03C3;', tex: '\\sigma'},
                { code: '&#x03C1;', tex: '\\rho'},
                { code: '&#x03F5;', tex: '\\epsilon'},
                { code: '&#x03BE;', tex: '\\xi'},
                { code: '&#x2126;', tex: '\\Omega'},
                { code: '&#x03A6;', tex: '\\Phi'},
                { code: '&#x03A3;', tex: '\\Sigma'},
                { code: '&#x0394;', tex: '\\Delta'},
                { code: '&#x0398;', tex: '\\Theta'},
                { code: '&#x03A0;', tex: '\\Pi'},
                { code: '&#x0393;', tex: '\\Gamma'},
                { code: '&#x039B;', tex: '\\Lambda'},
                { code: '&#x22EF;', tex: '\\cdots'},
                { code: '&#x22EE;', tex: '\\vdots'},
                { code: '&#x22F1;', tex: '\\ddots'}
            ]
        },
        {
            id: '2',
            name: 'Kí tự la mã',
            symbolArr: [
                { code: '&#x3B1;', tex: '\\alpha'},
                { code: '&#x3B2;', tex: '\\beta'},
                { code: '&#x3C7;', tex: '\\chi'},
                { code: '&#x3B4;', tex: '\\delta'},
                { code: '&#x3B5;', tex: '\\epsilon'},
                { code: '&#x3B7;', tex: '\\eta'},
                { code: '&#x3B3;', tex: '\\gamma'},
                { code: '&#x3B9;', tex: '\\iota'},
                { code: '&#x3BA;', tex: '\\kappa'},
                { code: '&#x03BB;', tex: '\\lambda'},
                { code: '&#x03BC;', tex: '\\mu'},
                { code: '&#x03BD;', tex: '\\nu'},
                { code: '&#x03A9;', tex: '\\omega'},
                { code: '&#x03D5;', tex: '\\phi'},
                { code: '&#x03C0;', tex: '\\pi'},
                { code: '&#x03C8;', tex: '\\psi'},
                { code: '&#x03A1;', tex: '\\rho'},
                { code: '&#x03C3;', tex: '\\sigma'},
                { code: '&#x03A4;', tex: '\\tau'},
                { code: '&#x03B8;', tex: '\\theta'},
                { code: '&#x03C5;', tex: '\\upsilon'},
                { code: '&#x03BE;', tex: '\\xi'},
                { code: '&#x0396;', tex: '\\zeta'},
                { code: '&#x03DC;', tex: '\\digamma'},
                { code: '&#x03F0;', tex: '\\varkappa'},
                { code: '&#x03C6;', tex: '\\varphi'},
                { code: '&#x03D6;', tex: '\\varpi'},
                { code: '&#x03F1;', tex: '\\varrho'},
                { code: '&#x03C2;', tex: '\\varsigma'},
                { code: '&#x03D1;', tex: '\\vartheta'},
                { code: '&#x0394;', tex: '\\Delta'},
                { code: '&#x0393;', tex: '\\Gamma'},
                { code: '&#x039B;', tex: '\\Lambda'},
                { code: '&#x03A9;', tex: '\\Omega'},
                { code: '&#x03A6;', tex: '\\Phi'},
                { code: '&#x03A0;', tex: '\\Pi'},
                { code: '&#x03A8;', tex: '\\Psi'},
                { code: '&#x03A3;', tex: '\\Sigma'},
                { code: '&#x0398;', tex: '\\Theta'},
                { code: '&#x03A5;', tex: '\\Upsilon'},
                { code: '&#x039E;', tex: '\\Xi'},
                { code: '&#x2135;', tex: '\\aleph'},
                { code: '&#x2136;', tex: '\\beth'},
                { code: '&#x2138;', tex: '\\daleth'},
                { code: '&#x2137;', tex: '\\gimel'}
            ]
        },
        {
            id: '3',
            name: 'Kí tự toán tử',
            symbolArr: [
                { code: '&#x2211;', tex: '\\sum'},
                { code: '&#x220F;', tex: '\\prod'},
                { code: '&#x2210;', tex: '\\coprod'},
                { code: '&#x222B;', tex: '\\int'},
                { code: '&#x222E;', tex: '\\oint'},
                { code: '&#x222C;', tex: '\\iint'},
                { code: '&#x2A04;', tex: '\\biguplus'},
                { code: '&#x22C2;', tex: '\\bigcap'},
                { code: '&#x22C3;', tex: '\\bigcup'},
                { code: '&#x2A01;', tex: '\\bigoplus'},
                { code: '&#x2A02;', tex: '\\bigotimes'},
                { code: '&#x2A00;', tex: '\\bigodot'},
                { code: '&#x22C1;', tex: '\\bigvee'},
                { code: '&#x22C0;', tex: '\\bigwedge'},
                { code: '&#x2A06;', tex: '\\bigsqcup'}
            ]
        },
        {
            id: '4',
            name: 'Kí tự phân chia',
            symbolArr: [
                { code: '&#x007C;', tex: '\\vert'},
                { code: '&#x2016;', tex: '\\Vert'},
                { code: '&#x2329;', tex: '\\langle'},
                { code: '&#x232A;', tex: '\\rangle'},
                { code: '&#x230A;', tex: '\\lfloor'},
                { code: '&#x230B;', tex: '\\rfloor'},
                { code: '&#x2308;', tex: '\\lceil'},
                { code: '&#x2309;', tex: '\\rceil'},
                { code: '&#x231E;', tex: '\\llcorner'},
                { code: '&#x231F;', tex: '\\lrcorner'},
                { code: '&#x231C;', tex: '\\ulcorner'},
                { code: '&#x231D;', tex: '\\urcorner'}
            ]
        },
        {
            id: '5',
            name: 'Toán tử',
            symbolArr: [
                { code: '&#x002A;', tex: '\\ast'},
                { code: '&#x22C6;', tex: '\\star'},
                { code: '&#x00B7;', tex: '\\cdot'},
                { code: '&#x2218;', tex: '\\circ'},
                { code: '&#x2219;', tex: '\\bullet'},
                { code: '&#x25CB;', tex: '\\bigcirc'},
                { code: '&#x22C4;', tex: '\\diamond'},
                { code: '&#x007D;', tex: '\\times'},
                { code: '&#x00F7;', tex: '\\div'},
                { code: '&#x2B1D;', tex: '\\centerdot'},
                { code: '&#x229B;', tex: '\\circledast'},
                { code: '&#x229A;', tex: '\\circledcirc'},
                { code: '&#x229D;', tex: '\\circleddash'},
                { code: '&#x2214;', tex: '\\dotplus'},
                { code: '&#x22C7;', tex: '\\divideontimes'},
                { code: '&#x00B1;', tex: '\\pm'},
                { code: '&#x2213;', tex: '\\mp'},
                { code: '&#x2A3F;', tex: '\\amalg'},
                { code: '&#x2299;', tex: '\\odot'},
                { code: '&#x2296;', tex: '\\ominus'},
                { code: '&#x2295;', tex: '\\oplus'},
                { code: '&#x2298;', tex: '\\oslash'},
                { code: '&#x2297;', tex: '\\otimes'},
                { code: '&#x2240;', tex: '\\wr'},
                { code: '&#x229E;', tex: '\\boxplus'},
                { code: '&#x229F;', tex: '\\boxminus'},
                { code: '&#x22A0;', tex: '\\boxtimes'},
                { code: '&#x22A1;', tex: '\\boxdot'},
                { code: '&#x25A1;', tex: '\\square'},
                { code: '&#x2229;', tex: '\\cap'},
                { code: '&#x222A;', tex: '\\cup'},
                { code: '&#x228E;', tex: '\\uplus'},
                { code: '&#x2293;', tex: '\\sqcap'},
                { code: '&#x2294;', tex: '\\sqcup'},
                { code: '&#x2227;', tex: '\\wedge'},
                { code: '&#x2228;', tex: '\\vee'},
                { code: '&#x2020;', tex: '\\dagger'},
                { code: '&#x2021;', tex: '\\ddagger'},
                { code: '&#x2305;', tex: '\\barwedge'},
                { code: '&#x22CF;', tex: '\\curlywedge'},
                { code: '&#x22D2;', tex: '\\Cap'},
                { code: '&#x22A5;', tex: '\\bot'},
                { code: '&#x22BA;', tex: '\\intercal'},
                { code: '&#x2A5E;', tex: '\\doublebarwedge'},
                { code: '&#x25C1;', tex: '\\lhd'},
                { code: '&#x25B7;', tex: '\\rhd'},
                { code: '&#x25C3;', tex: '\\triangleleft'},
                { code: '&#x25B9;', tex: '\\triangleright'},
                { code: '&#x22B4;', tex: '\\unlhd'},
                { code: '&#x22B5;', tex: '\\unrhd'},
                { code: '&#x25BD;', tex: '\\bigtriangledown'},
                { code: '&#x25B3;', tex: '\\bigtriangleup'},
                { code: '&#x2216;', tex: '\\setminus'},
                { code: '&#x22BB;', tex: '\\veebar'},
                { code: '&#x22CE;', tex: '\\curlyvee'},
                { code: '&#x22D3;', tex: '\\Cup'},
                { code: '&#x22A4;', tex: '\\top'},
                { code: '&#x22CC;', tex: '\\rightthreetimes'},
                { code: '&#x22CB;', tex: '\\leftthreetimes'}
            ]
        },
        {
            id: '6',
            name: 'Mũi tên',
            symbolArr: [
                { code: '&#x2190;', tex: '\\leftarrow'},
                { code: '&#x21D0;', tex: '\\Leftarrow'},
                { code: '&#x2192;', tex: '\\rightarrow'},
                { code: '&#x21D2;', tex: '\\Rightarrow'},
                { code: '&#x2194;', tex: '\\leftrightarrow'},
                { code: '&#x21D4;', tex: '\\Leftrightarrow'},
                { code: '&#x27F5;', tex: '\\longleftarrow'},
                { code: '&#x27F8;', tex: '\\Longleftarrow'},
                { code: '&#x27F6;', tex: '\\longrightarrow'},
                { code: '&#x27F9;', tex: '\\Longrightarrow'},
                { code: '&#x27F7;', tex: '\\longleftrightarrow'},
                { code: '&#x27FA;', tex: '\\Longleftrightarrow'},
                { code: '&#x2191;', tex: '\\uparrow'},
                { code: '&#x21D1;', tex: '\\Uparrow'},
                { code: '&#x2193;', tex: '\\downarrow'},
                { code: '&#x21D3;', tex: '\\Downarrow'},
                { code: '&#x2195;', tex: '\\updownarrow'},
                { code: '&#x21D1;', tex: '\\Updownarrow'},
                { code: '&#x21BC;', tex: '\\leftharpoonup'},
                { code: '&#x21BD;', tex: '\\leftharpoondown'},
                { code: '&#x21C0;', tex: '\\rightharpoonup'},
                { code: '&#x21C1;', tex: '\\rightharpoondown'},
                { code: '&#x21CC;', tex: '\\rightleftharpoons'},
                { code: '&#x21C6;', tex: '\\leftrightarrows'},
                { code: '&#x2197;', tex: '\\nearrow'},
                { code: '&#x2198;', tex: '\\searrow'},
                { code: '&#x2199;', tex: '\\swarrow'},
                { code: '&#x2196;', tex: '\\nwarrow'}
            ]
        },
        {
            id: '7',
            name: 'Khác',
            symbolArr: [
                { code: '&#x221E;', tex: '\\infty'},
                { code: '&#x2207;', tex: '\\nabla'},
                { code: '&#x2202;', tex: '\\partial'},
                { code: '&#x2204;', tex: '\\nexists'},
                { code: '&#x2205;', tex: '\\varnothing'},
                { code: '&#x266F;', tex: '\\sharp'},
                { code: '&#x266D;', tex: '\\flat'},
                { code: '&#x266E;', tex: '\\natural'},
                { code: '&#x221A;', tex: '\\surd'},
                { code: '&#x2220;', tex: '\\angle'},
                { code: '&#x2221;', tex: '\\measuredangle'},
                { code: '&#x2222;', tex: '\\sphericalangle'},
                { code: '&#x2201;', tex: '\\complement'},
                { code: '&#x25BF;', tex: '\\triangledown'},
                { code: '&#x25B5;', tex: '\\vartriangle'},
                { code: '&#x25AA;', tex: '\\blacksquare'},
                { code: '&#x25B4;', tex: '\\blacktriangle'},
                { code: '&#x25BE;', tex: '\\blacktriangledown'}
            ]
        }
    ];
    mathtypeVm.selectedSymbolGroup = mathtypeVm.symbolGroupList[0];

    //<editor-fold desc="equationGroup">
    mathtypeVm.fractionGroup = [
        {   type: 0, heading: "Kiểu phân số" },
        {
            type: 1, //item type row
            items: [
                { id: "fraction1", tex: "\\frac{x}{y}"},
                { id: "fraction2", tex: "{x}/{y}"}
            ]
        },
        {   type: 0, heading: "Mẫu phổ biến"},
        {
            type: 1,
            items: [
                { id: "fraction3", tex: "\\frac{dx}{dy}"},
                { id: "fraction4", tex: "\\frac{\\Delta x}{\\Delta y}"},
                { id: "fraction5", tex: "\\frac{\\partial x}{\\partial y}"},
                { id: "fraction6", tex: "\\frac{\\delta x}{\\delta y}"},
                { id: "fraction7", tex: "\\frac{\\pi }{2}"}
            ]
        }
    ];

    mathtypeVm.scriptGroup = [
        {   type: 0, heading: "Kiểu hàm mũ" },
        {
            type: 1, //item type row
            items: [
                { id: "script1", tex: "e^{x}"},
                { id: "script2", tex: "e_{y}"},
                { id: "script3", tex: "e_{y}^{x}"},
                { id: "script4", tex: "_{y}^{x}e"}
            ]
        },
        {   type: 0, heading: "Mẫu phổ biến"},
        {
            type: 1,
            items: [
                { id: "script5", tex: "x_{y^{2}}"},
                { id: "script6", tex: "e^{-i\\omega t}"},
                { id: "script7", tex: "x^{2}"}
            ]
        }
    ];

    mathtypeVm.radicalGroup = [
        {   type: 0, heading: "Kiểu hàm căn" },
        {
            type: 1, //item type row
            items: [
                { id: "radical1", tex: "\\sqrt{x}"},
                { id: "radical2", tex: "\\sqrt[n]{x}"}
            ]
        },
        {   type: 0, heading: "Mẫu phổ biến"},
        {
            type: 1,
            items: [
                { id: "radical3", tex: "\\frac{-b\\pm \\sqrt{\\Delta}}{2a}"},
                { id: "radical4", tex: "\\sqrt{a^{2}+b^{2}}"}
            ]
        }
    ];

    mathtypeVm.integralGroup = [
        {   type: 0, heading: "Kiểu tích phân" },
        {
            type: 1, //item type row
            items: [
                { id: "integral1", tex: "\\int{u}"},
                { id: "integral2", tex: "\\int_{a}^{b}{u}"},
                { id: "integral3", tex: "\\int\\limits_{a}^{b}{u}"}
            ]
        },
        {
            type: 1, //item type row
            items: [
                { id: "integral4", tex: "\\iint{u}"},
                { id: "integral5", tex: "\\iint_{a}^{b}{u}"},
                { id: "integral6", tex: "\\iint\\limits_{a}^{b}{u}"}
            ]
        },
        {
            type: 1, //item type row
            items: [
                { id: "integral7", tex: "\\oint{u}"},
                { id: "integral8", tex: "\\oint_{a}^{b}{u}"},
                { id: "integral9", tex: "\\oint\\limits_{a}^{b}{u}"}
            ]
        }
    ];

    mathtypeVm.largeOperatorGroup = [
        {   type: 0, heading: "Kiểu tổng" },
        {
            type: 1, //item type row
            items: [
                { id: "largeOperator1", tex: "\\sum{u}"},
                { id: "largeOperator2", tex: "\\sum\\limits_{i=0}^{n}{u}"},
                { id: "largeOperator3", tex: "\\sum_{i=0}^{n}{u}"},
                { id: "largeOperator4", tex: "\\sum\\limits_{i}{u}"},
                { id: "largeOperator5", tex: "\\sum_{i}{u}"}
            ]
        },
        {   type: 0, heading: "Kiểu tích" },
        {
            type: 1, //item type row
            items: [
                { id: "largeOperator6", tex: "\\prod{u}"},
                { id: "largeOperator7", tex: "\\prod\\limits_{i=0}^{n}{u}"},
                { id: "largeOperator8", tex: "\\prod_{i=0}^{n}{u}"},
                { id: "largeOperator9", tex: "\\prod\\limits_{i}{u}"},
                { id: "largeOperator10", tex: "\\prod_{i}{u}"}
            ]
        },
        {   type: 0, heading: "Kiểu hợp, giao" },
        {
            type: 1, //item type row
            items: [
                { id: "largeOperator11", tex: "\\bigcap\\limits_{a}^{b}{u}"},
                { id: "largeOperator12", tex: "\\bigcup\\limits_{a}^{b}{u}"},
                { id: "largeOperator13", tex: "\\bigwedge\\limits_{a}^{b}{u}"},
                { id: "largeOperator14", tex: "\\bigvee\\limits_{a}^{b}{u}"}
            ]
        },
        {   type: 0, heading: "Mẫu phổ biến"},
        {
            type: 1,
            items: [
                { id: "largeOperator15", tex: "\\displaystyle\\sum\\limits_{k}\\left(\\begin{matrix}{n}\\\\{k}\\end{matrix}\\right)"},
                { id: "largeOperator16", tex: "\\sum\\limits_{\\substack{0\\leq i\\leq m \\\\ 0\\leq j\\leq n}}{P(i,j)}"},
                { id: "largeOperator17", tex: "\\prod\\limits_{k=1}^{n}{A_{k}}"},
                { id: "largeOperator18", tex: "\\bigcup\\limits_{n=1}^{m}{X_{n}\\cap Y_{n}}"}
            ]
        }
    ];

    mathtypeVm.bracketGroup = [
        {   type: 0, heading: "Kiểu dấu ngoặc" },
        {
            type: 1, //item type row
            items: [
                { id: "bracket1", tex: "(s)"},
                { id: "bracket2", tex: "[s]"},
                { id: "bracket3", tex: "\\{s\\}"},
                { id: "bracket4", tex: "|s|"},
                { id: "bracket5", tex: "\\|s\\|"},
                { id: "bracket6", tex: "\\lceil s\\rceil"},
                { id: "bracket7", tex: "\\lfloor s\\rfloor"},
                { id: "bracket8", tex: "\\langle s\\rangle"}
            ]
        },
        {   type: 0, heading: "Kiểu dấu ngoặc lớn" },
        {
            type: 1, //item type row
            items: [
                { id: "bracket9", tex: "\\left(s\\right)"},
                { id: "bracket10", tex: "\\left[s\\right]"},
                { id: "bracket11", tex: "\\left\\{s\\right\\}"},
                { id: "bracket12", tex: "\\left|s\\right|"},
                { id: "bracket13", tex: "\\left\\|s\\right\\|"},
                { id: "bracket14", tex: "\\left\\lceil s\\right\\rceil"},
                { id: "bracket15", tex: "\\left\\lfloor s\\right\\rfloor"}
            ]
        },
        {   type: 0, heading: "Kiểu nhóm"},
        {
            type: 1,
            items: [
                { id: "bracket16", tex: "\\begin{cases}{x}\\\\{y}\\end{cases}"},
                { id: "bracket17", tex: "\\begin{cases}{x}\\\\{y}\\\\{z}\\end{cases}"},
                { id: "bracket18", tex: "\\left[\\begin{matrix}{x}\\\\{y}\\end{matrix}\\right."},
                { id: "bracket19", tex: "\\left[\\begin{matrix}{x}\\\\{y}\\\\{z}\\end{matrix}\\right."}
            ]
        },
        {   type: 0, heading: "Mẫu phổ biến"},
        {
            type: 1,
            items: [
                { id: "bracket20", tex: "f(x)=\\begin{cases}{-x,}&\\quad{x<0}\\\\{x,}&\\quad{x\\geq 0}\\end{cases}"}
            ]
        },
        {
            type: 1,
            items: [
                { id: "bracket21", tex: "f(u)=\\begin{cases}{x}&\\quad\\text{nếu n chẵn}\\\\{y}&\\quad\\text{nếu n lẽ}\\end{cases}"}
            ]
        }
    ];

    mathtypeVm.sinLimGroup = [
        {   type: 0, heading: "Kiểu lượng giác" },
        {
            type: 1, //item type row
            items: [
                { id: "sinLim1", tex: "\\sin{x}"},
                { id: "sinLim2", tex: "\\cos{x}"},
                { id: "sinLim3", tex: "\\tan{x}"},
                { id: "sinLim4", tex: "\\csc{x}"},
                { id: "sinLim5", tex: "\\sec{x}"},
                { id: "sinLim6", tex: "\\cot{x}"}
            ]
        },
        {   type: 0, heading: "Kiểu lượng giác đảo" },
        {
            type: 1, //item type row
            items: [
                { id: "sinLim7", tex: "\\sin^{-1}{x}"},
                { id: "sinLim8", tex: "\\cos^{-1}{x}"},
                { id: "sinLim9", tex: "\\tan^{-1}{x}"}
            ]
        },
        {
            type: 1, //item type row
            items: [
                { id: "sinLim10", tex: "\\csc^{-1}{x}"},
                { id: "sinLim11", tex: "\\sec^{-1}{x}"},
                { id: "sinLim12", tex: "\\cot^{-1}{x}"}
            ]
        },
        {   type: 0, heading: "Kiểu giới hạn" },
        {
            type: 1, //item type row
            items: [
                { id: "sinLim13", tex: "\\lim_{n\\to\\infty}{u}"},
                { id: "sinLim14", tex: "\\log{u}"},
                { id: "sinLim15", tex: "\\log_{a}{b}"}
            ]
        },
        {
            type: 1, //item type row
            items: [
                { id: "sinLim16", tex: "\\ln{a}"},
                { id: "sinLim17", tex: "\\min_{a}{b}"},
                { id: "sinLim18", tex: "\\max_{a}{b}"}
            ]
        },
        {   type: 0, heading: "Mẫu phổ biến"},
        {
            type: 1,
            items: [
                { id: "sinLim19", tex: "\\sin{\\theta}"},
                { id: "sinLim20", tex: "\\cos{2x}"},
                { id: "sinLim21", tex: "\\tan{\\theta}=\\frac{\\sin{\\theta}}{\\cos{\\theta}}"},
                { id: "sinLim22", tex: "\\lim_{n\\to\\infty}\\left(1+\\frac{1}{n}\\right)^{n}"}
            ]
        }
    ];

    mathtypeVm.reactGroup = [
        {   type: 0, heading: "Kiểu nón" },
        {
            type: 1, //item type row
            items: [
                { id: "react1", tex: "\\overrightarrow{a}"},
                { id: "react2", tex: "\\overleftarrow{a}"},
                { id: "react3", tex: "\\overleftrightarrow{a}"},
                { id: "react4", tex: "\\mathop{a}\\limits^{\\leftharpoonup}"},
                { id: "react5", tex: "\\mathop{a}\\limits^{\\rightharpoonup}"}
            ]
        },
        {
            type: 1, //item type row
            items: [
                { id: "react6", tex: "\\widetilde{a}"},
                { id: "react7", tex: "\\overline{a}"},
                { id: "react8", tex: "\\widehat{a}"},
                { id: "react9", tex: "\\stackrel\\smile{a}"},
                { id: "react10", tex: "\\stackrel\\frown{a}"}
            ]
        },
        {   type: 0, heading: "Kiểu phương trình" },
        {
            type: 1, //item type row
            items: [
                { id: "react11", tex: "A\\stackrel{x}{\\rightarrow}B"},
                { id: "react12", tex: "A\\stackrel{x}{\\leftarrow}B"},
                { id: "react13", tex: "A\\mathop{\\leftrightarrow}\\limits_{x}B"},
                { id: "react14", tex: "A\\stackrel{x}{\\leftrightarrow}B"}
            ]
        },
        {
            type: 1, //item type row
            items: [
                { id: "react15", tex: "A\\mathop{\\Leftarrow}\\limits_{x}B"},
                { id: "react16", tex: "A\\mathop{\\Rightarrow}\\limits_{x}B"},
                { id: "react17", tex: "A\\stackrel{x}{\\Leftarrow}B"},
                { id: "react18", tex: "A\\stackrel{x}{\\Rightarrow}B"}
            ]
        },
        {
            type: 1, //item type row
            items: [
                { id: "react19", tex: "A\\mathop{\\Leftrightarrow}\\limits_{x}B"},
                { id: "react20", tex: "A\\stackrel{x}{\\Leftrightarrow}B"},
                { id: "react21", tex: "A\\stackrel{x}{=}B"}
            ]
        }
    ];

    mathtypeVm.matrixGroup = [
        {   type: 0, heading: "Kiểu ma trận" },
        {
            type: 1, //item type row
            items: [
                { id: "matrix1", tex: "\\begin{matrix}{x}&{y}\\end{matrix}"},
                { id: "matrix2", tex: "\\begin{matrix}{x}\\\\{y}\\end{matrix}"},
                { id: "matrix3", tex: "\\begin{matrix}{x}&{y}&{z}\\end{matrix}"},
                { id: "matrix4", tex: "\\begin{matrix}{x}\\\\{y}\\\\{z}\\end{matrix}"}
            ]
        },
        {
            type: 1, //item type row
            items: [
                { id: "matrix5", tex: "\\begin{matrix}{x}&{z}\\\\{y}&{t}\\end{matrix}"},
                { id: "matrix6", tex: "\\begin{matrix}{x}&{y}&{z}\\\\{t}&{u}&{v}\\end{matrix}"},
                { id: "matrix7", tex: "\\begin{matrix}{x}&{t}\\\\{y}&{u}\\\\{z}&{v}\\end{matrix}"},
                { id: "matrix8", tex: "\\begin{matrix}{x}&{t}&{l}\\\\{y}&{u}&{m}\\\\{z}&{v}&{n}\\end{matrix}"}
            ]
        },
        {   type: 0, heading: "Kiểu ma trận có ngoặc" },
        {
            type: 1, //item type row
            items: [
                { id: "matrix9", tex: "\\begin{pmatrix}{x}&{z}\\\\{y}&{t}\\end{pmatrix}"},
                { id: "matrix10", tex: "\\begin{bmatrix}{x}&{z}\\\\{y}&{t}\\end{bmatrix}"},
                { id: "matrix11", tex: "\\begin{vmatrix}{x}&{z}\\\\{y}&{t}\\end{vmatrix}"},
                { id: "matrix12", tex: "\\begin{Vmatrix}{x}&{z}\\\\{y}&{t}\\end{Vmatrix}"}
            ]
        },
        {   type: 0, heading: "Kiểu ma trận thưa" },
        {
            type: 1, //item type row
            items: [
                { id: "matrix13", tex: "\\begin{pmatrix}{x} & \\cdots & {u}\\\\ \\vdots & \\ddots & \\vdots\\\\ {y} & \\cdots & {v}\\end{pmatrix}"},
                { id: "matrix14", tex: "\\begin{bmatrix}{x} & \\cdots & {u}\\\\ \\vdots & \\ddots & \\vdots\\\\ {y} & \\cdots & {v}\\end{bmatrix}"}
            ]
        }
    ];

    mathtypeVm.chemGroup = [
        {   type: 0, heading: "Thư viện hóa học mhchm" },
        {
            type: 1, //item type row
            items: [
                { id: "chem1", tex: "\\ce{A v -> B ^}"}
            ]
        },
        {
            type: 1, //item type row
            items: [
                { id: "chem2", tex: "\\ce{SO4^21- + Ba^2+ -> BaSO4 v}"}
            ]
        },
        {
            type: 1, //item type row
            items: [
                { id: "chem3", tex: "\\ce{ CO2 + C <=> 2CO }"}
            ]
        },
        {
            type: 1, //item type row
            items: [
                { id: "chem4", tex: "\\ce{Hg^2+ ->[I-]$\\underset{\\mathrm{red}}{\\ce{HgI2}}$->[I-]$\\underset{\\mathrm{red}}{\\ce{[Hg^{II}I4]^2-}}$}"}
            ]
        }
    ];

    mathtypeVm.equationGroups1 = [
        {
            name: 'fractionGroup',
            detail: mathtypeVm.fractionGroup
        },
        {
            name: 'scriptGroup',
            detail: mathtypeVm.scriptGroup
        },
        {
            name: 'radicalGroup',
            detail: mathtypeVm.radicalGroup
        },
        {
            name: 'integralGroup',
            detail: mathtypeVm.integralGroup
        },
        {
            name: 'largeOperatorGroup',
            detail: mathtypeVm.largeOperatorGroup
        }
    ];

    mathtypeVm.equationGroups2 = [
        {
            name: 'bracketGroup',
            detail: mathtypeVm.bracketGroup
        },
        {
            name: 'sinLimGroup',
            detail: mathtypeVm.sinLimGroup
        },
        {
            name: 'reactGroup',
            detail: mathtypeVm.reactGroup
        },
        {
            name: 'matrixGroup',
            detail: mathtypeVm.matrixGroup
        },
        {
            name: 'chemGroup',
            detail: mathtypeVm.chemGroup
        }
    ];
    //</editor-fold>

    /**
     * render html
     * @param html_code
     * @returns {*}
     */
    mathtypeVm.renderHtml = function(html_code) {
        return $sce.trustAsHtml(html_code);
    };

    /**
     * finish type math equation and return this equation to original page
     */
    mathtypeVm.finish = function () {
        if (mathtypeVm.equation != "") {
            var finishEquation = mathtypeVm.equation;
            finishEquation = finishEquation.trim();

            finishEquation = finishEquation.replace(/<|>|&/g, function(str){
                switch (str) {
                    case "<": return "&lt;";
                    case ">": return "&gt;";
                    case "&": return "&amp;";
                }
            });

            top.tinymce.activeEditor.windowManager.getParams().oninsert(finishEquation, mathtypeVm.blockDisplay);
        }
        top.tinymce.activeEditor.windowManager.close();
    };

    /**
     * cancel math equation type
     */
    mathtypeVm.cancel = function () {
        top.tinymce.activeEditor.windowManager.close();
    };
}]);

mainApp.controller('activateEmailCtrl', ['$scope', '$uibModalInstance', 'ProfileService', 'email', function($scope, $uibModalInstance, ProfileService, email){
    var activateEmailVm = this; //view's model for detail controller
    activateEmailVm.email = email;
    activateEmailVm.activateCode = '';
    activateEmailVm.statusMessage = '';
    activateEmailVm.processing = false;

    activateEmailVm.status = 0;
    //send confirm email with code
    ProfileService.sendActivateEmail({}, {}, function successCallback(response){
        activateEmailVm.status = (response.success) ? 1 : -1;
    }, function errorCallback(response){
        activateEmailVm.status = -1;
    });

    activateEmailVm.cancel = function () {
        $uibModalInstance.close(false);
    };

    activateEmailVm.finish = function () {
        if (activateEmailVm.activateCode == ''
            || activateEmailVm.activateCode.length != 16) {
            activateEmailVm.statusMessage = 'Mã kích hoạt không hợp lệ';
            return;
        }

        activateEmailVm.processing = true;
        activateEmailVm.statusMessage = 'Hệ thống đang xử lý, vui lòng đợi trong giây lát...';
        ProfileService.activate({e: activateEmailVm.email, code: activateEmailVm.activateCode}, function successCallback(response) {
            if (response.success) {
                $uibModalInstance.close(true);
            } else {
                activateEmailVm.statusMessage = 'Mã kích hoạt không khớp.';
            }
            activateEmailVm.processing = false;
        }, function errorCallback(response) {
            activateEmailVm.statusMessage = 'Lỗi kiểm tra mã kích hoạt.';
            activateEmailVm.processing = false;
        });
    };

}]);
mainApp.controller('editPrivateCodeCtrl', ['$scope', '$uibModalInstance', 'ProfileService', function($scope, $uibModalInstance, ProfileService){
    var editPrivateCodeVm = this; //view's model for detail controller
    editPrivateCodeVm.code = '';
    editPrivateCodeVm.statusMessage = '';
    editPrivateCodeVm.processing = false;

    editPrivateCodeVm.cancel = function () {
        $uibModalInstance.close({
            'success': false,
            'code': editPrivateCodeVm.code
        });
    };

    editPrivateCodeVm.finish = function () {
        if (editPrivateCodeVm.code == ''
            || editPrivateCodeVm.code.length != 8) {
            editPrivateCodeVm.statusMessage = 'Mã không hợp lệ';
            return;
        }

        editPrivateCodeVm.processing = true;
        editPrivateCodeVm.statusMessage = 'Hệ thống đang kiểm tra mã...';
        ProfileService.verifyCode({}, {code: editPrivateCodeVm.code}, function successCallback(response) {
            if (response.success) {
                $uibModalInstance.close({
                    'success': true,
                    'code': editPrivateCodeVm.code
                });
            } else {
                editPrivateCodeVm.statusMessage = 'Mã không khớp.';
            }
            editPrivateCodeVm.processing = false;
        }, function errorCallback(response) {
            editPrivateCodeVm.statusMessage = 'Lỗi kiểm tra mã.';
            editPrivateCodeVm.processing = false;
        });
    };

}]);
mainApp.controller('editPrivateCtrl', ['$scope', '$uibModalInstance', 'ProfileService', 'privateData', function($scope, $uibModalInstance, ProfileService, privateData){
    var editPrivateVm = this; //view's model for detail controller
    editPrivateVm.fieldString = (privateData['field'] == 'id_card') ? 'CMND' : ((privateData['field'] == 'telephone') ? 'Số điện thoại' : 'Số tài khoản');
    editPrivateVm.feild = privateData['field'];
    editPrivateVm.currentValue = privateData['value'];
    editPrivateVm.code = privateData['code'];
    editPrivateVm.value = '';
    editPrivateVm.statusMessage = '';
    editPrivateVm.processing = false;

    editPrivateVm.cancel = function () {
        $uibModalInstance.close({
            'success': false,
            'newValue': ''
        });
    };

    editPrivateVm.finish = function () {
        if (editPrivateVm.value.length > 255) {
            editPrivateVm.statusMessage = 'Giá trị không hợp lệ';
            return;
        }

        if (editPrivateVm.value == editPrivateVm.currentValue) {
            editPrivateVm.statusMessage = 'Giá trị không thay đổi';
            return;
        }

        editPrivateVm.processing = true;
        editPrivateVm.statusMessage = 'Đang lưu thông tin cập nhật...';
        var postData = {};
        postData['verification_code'] = editPrivateVm.code;
        postData[editPrivateVm.feild] = editPrivateVm.value;

        console.log(postData);

        ProfileService.save({}, postData, function successCallback(response) {
            if (response.success) {
                $uibModalInstance.close({
                    'success': true,
                    'newValue': editPrivateVm.value
                });
            } else {
                editPrivateVm.statusMessage = 'Giá trị không khớp.';
            }
            editPrivateVm.processing = false;
        }, function errorCallback(response) {
            editPrivateVm.statusMessage = 'Lỗi kiểm tra mã.';
            editPrivateVm.processing = false;
        });

    };

}]);
mainApp.controller('editPrivatePasswordCtrl', ['$scope', '$uibModalInstance', 'ProfileService', function($scope, $uibModalInstance, ProfileService){
    var editPrivatePasswordVm = this; //view's model for detail controller
    editPrivatePasswordVm.password = '';
    editPrivatePasswordVm.statusMessage = '';
    editPrivatePasswordVm.processing = false;

    editPrivatePasswordVm.cancel = function () {
        $uibModalInstance.close(false);
    };

    editPrivatePasswordVm.finish = function () {
        if (editPrivatePasswordVm.password == ''
            || editPrivatePasswordVm.password.length < 8
            || editPrivatePasswordVm.password.length > 255) {
            editPrivatePasswordVm.statusMessage = 'Mật khẩu không hợp lệ';
            return;
        }

        editPrivatePasswordVm.processing = true;
        editPrivatePasswordVm.statusMessage = 'Hệ thống đang xử lý, vui lòng đợi trong giây lát...';
        ProfileService.verifyPassword({}, {password: editPrivatePasswordVm.password}, function successCallback(response) {
            if (response.success) {
                $uibModalInstance.close(true);
            } else {
                editPrivatePasswordVm.statusMessage = 'Mật khẩu không khớp.';
            }
            editPrivatePasswordVm.processing = false;
        }, function errorCallback(response) {
            editPrivatePasswordVm.statusMessage = 'Lỗi kiểm tra mật khẩu.';
            editPrivatePasswordVm.processing = false;
        });


    };

}]);
mainApp.controller('editProfileCtrl', ['$scope', '$timeout', '$window', '$uibModal', 'Upload', 'ProfileService', function($scope, $timeout, $window, $uibModal, Upload, ProfileService){
    var editProfileVm = this;
    editProfileVm.months = [
        'Tháng 1',
        'Tháng 2',
        'Tháng 3',
        'Tháng 4',
        'Tháng 5',
        'Tháng 6',
        'Tháng 7',
        'Tháng 8',
        'Tháng 9',
        'Tháng 10',
        'Tháng 11',
        'Tháng 12'
    ];      //month string list

    editProfileVm.init = function (data) {
        editProfileVm.userId = data.userId;
        editProfileVm.avatar = data.avatar;
        editProfileVm.lastName = data.lastName;
        editProfileVm.firstName = data.firstName;
        editProfileVm.gender = data.gender;
        editProfileVm.birth = {};
        editProfileVm.birth.day = data.birthDay;
        editProfileVm.birth.month = data.birthMonth;
        editProfileVm.birth.year = data.birthYear;
        editProfileVm.birthdate = data.birthDate;
        editProfileVm.idCard = data.idCard;
        editProfileVm.about = data.about;
        editProfileVm.school = data.school;
        editProfileVm.studentId = data.studentId;
        editProfileVm.position = data.position;
        editProfileVm.fields = data.fields;
        editProfileVm.telephone = data.telephone;
        editProfileVm.address = data.address;
        editProfileVm.facebook = data.facebook;
        editProfileVm.twitter = data.twitter;
        editProfileVm.bank = data.bank;
        editProfileVm.bankId = data.bankId;

        //check private data is empty for update when finish if changes
        editProfileVm.emptyIdCard = (data.idCard == '');
        editProfileVm.emptyTelephone = (data.telephone == '');
        editProfileVm.emptyBankId = (data.bankId == '');

    };

    editProfileVm.submit = function (isValid) {
        if (isValid) {
            var postData = {};
            var isUpdate = false;

            if (editProfileVm.idCard != '' && editProfileVm.emptyIdCard) {
                postData['id_card'] = editProfileVm.idCard;
                isUpdate = true;
            }

            if (editProfileVm.telephone != '' && editProfileVm.emptyTelephone) {
                postData['telephone'] = editProfileVm.telephone;
                isUpdate = true;
            }

            //if (editProfileVm.bankId != '' && editProfileVm.emptyBankId) {
                postData['bank_id'] = editProfileVm.bankId;
                isUpdate = true;
            //}

            if (isUpdate) {
                editProfileVm.statusMessage = 'Đang lưu...';
                ProfileService.save({}, postData, function successCallback(response){
                    if (response.success) {
                        editProfileVm.statusMessage = 'Đã lưu.';

                        //redirect to profile show page
                        $window.location.href = '/profile/show/' + editProfileVm.userId;
                    } else {
                        editProfileVm.statusMessage = 'Không lưu được.';
                    }
                }, function errorCallback(response){
                    if (response.status == 422) {
                        editProfileVm.statusMessage = 'Dữ liệu không hợp lệ...';

                        $timeout(function(){
                            editProfileVm.statusMessage = '';
                        }, 5000);
                    } else {
                        editProfileVm.statusMessage = 'Không lưu được...';
                    }
                });

            } else {
                //redirect to profile show page
                $window.location.href = '/profile/show/' + editProfileVm.userId;
            }
        }
    };

    editProfileVm.avatarProgress = false;  //progress bar to show uploading image progress
    editProfileVm.progressImageUpload = 0; //progress percent
    //upload image to server by ng-file-upload module
    editProfileVm.upload = function(file) {
        if (file && !file.$error) {
            editProfileVm.progressImageUpload = 0;
            editProfileVm.avatarProgress = true;
            Upload.upload({
                url: '/u/profile/avatar',
                data: {avatar: file}
            }).then(function successCallback(response) {
                editProfileVm.avatar = response.data.avatar + '?' + new Date().getTime(); //force ng-src refresh
                editProfileVm.progressImageUpload = 95;
                $timeout(function(){
                    editProfileVm.avatarProgress = false;
                    editProfileVm.progressImageUpload = 100;
                }, 100);
            }, function errorCallback(response) {
                editProfileVm.avatarProgress = false;
            }, function progressCallback(event) {
                editProfileVm.progressImageUpload = parseInt(90.0 * event.loaded / event.total);
            });
        }
    };

    editProfileVm.statusMessage = '';
    editProfileVm.update = function (isValid, field, value) {
        if (!isValid) return;

        //not update for special field (private data) directly. Just update when user press finish button
        //The reason is if they are empty, server save them directly, not require verification code.
        // However, if they are not empty, server will be require verification code before update
        if (field == 'id_card' || field == 'telephone' || field == 'bank_id') return;

        var postData = {};
        postData[field] = value;

        editProfileVm.statusMessage = 'Đang lưu...';
        ProfileService.save({}, postData, function successCallback(response){
            if (response.success) {
                editProfileVm.statusMessage = 'Đã lưu.';
            } else {
                editProfileVm.statusMessage = 'Không lưu được.';
            }
            $timeout(function(){
                editProfileVm.statusMessage = '';
            }, 2000);
        }, function errorCallback(response){
            if (response.status == 422) {
                editProfileVm.statusMessage = 'Dữ liệu không hợp lệ...';

                $timeout(function(){
                    editProfileVm.statusMessage = '';
                }, 5000);
            } else {
                editProfileVm.statusMessage = 'Không lưu được...';
            }
        });

    };

    editProfileVm.updatePrivateData = function (field, currentValue) {
        var passwordModalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'editPrivatePasswordModal.html',
            controller: 'editPrivatePasswordCtrl',
            controllerAs: 'editPrivatePasswordVm',
            keyboard: true
        });

        //store new settings if user changed
        passwordModalInstance.result.then(function (isVerifiedPassword){
            if (isVerifiedPassword) {
                var codeModalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'editPrivateCodeModal.html',
                    controller: 'editPrivateCodeCtrl',
                    controllerAs: 'editPrivateCodeVm',
                    keyboard: false,
                    backdrop: 'static'
                });

                codeModalInstance.result.then(function (result) {
                    console.log(result);
                    if (result.success) {
                        var privateModalInstance = $uibModal.open({
                            animation: true,
                            templateUrl: 'editPrivateModal.html',
                            controller: 'editPrivateCtrl',
                            controllerAs: 'editPrivateVm',
                            keyboard: false,
                            backdrop: 'static',
                            resolve: {
                                privateData: function () {
                                    var data = {};
                                    data['field'] = field;
                                    data['value'] = currentValue;
                                    data['code'] = result.code;
                                    return data;
                                }
                            }
                        });

                        privateModalInstance.result.then(function (result) {
                            if (result.success) {
                                switch (field) {
                                    case 'id_card':
                                        editProfileVm.idCard = result.newValue;
                                        break;
                                    case 'telephone':
                                        editProfileVm.telephone = result.newValue;
                                        break;
                                    case 'bank_id':
                                        editProfileVm.bankId = result.newValue;
                                        break;
                                }
                            }
                            //editProfileVm[field] = newValue;
                            //editProfileVm.update(true, field, newValue);
                        });
                    }
                });
            }
        });
    };

}]);
mainApp.controller('showProfileCtrl', ['$scope', '$window', '$timeout', '$uibModal', 'ProfileService', function($scope, $window, $timeout, $uibModal, ProfileService){
    var showProfileVm = this;
    showProfileVm.query = ''; //query string on header

    showProfileVm.init = function (data) {
        showProfileVm.loggedIn = data.loggedIn;
        showProfileVm.userId = data.userId;
        showProfileVm.vote = data.vote;
        showProfileVm.voteNumStr = '(' + data.voteNum + ')';
        showProfileVm.email = data.email;
        showProfileVm.activated = data.activated;

    };

    /**
     * search exam on header bar
     */
    showProfileVm.searchExam = function () {
        console.log('search exam');
        showProfileVm.query = showProfileVm.query.trim();
        console.log(showProfileVm.query);
        if (showProfileVm.query.length === 0 ) return;

        $window.location.href = '/search?q=' + showProfileVm.query;
    };


    //<editor-fold desc="voting user">
    showProfileVm.voteMessage = '';    //rating message to info error if any
    showProfileVm.hoverRating = 0;     //hover rating (temp rating when user hover star icons)

    /**
     * user change voting
     * @param param
     */
    showProfileVm.clickStar = function (param) {
        if (showProfileVm.loggedIn) {
            showProfileVm.voteMessage = '(Đang cập nhật bình chọn)';

            ProfileService.vote({'userId': showProfileVm.userId}, {'vote_point': param}, function successCallback(response){
                if (response.success) {
                    showProfileVm.voteMessage = '(Đã thực hiện bình chọn)';
                    showProfileVm.voteNum = '(' + response.voteNum + ')';
                } else {
                    showProfileVm.voteMessage = response.message;
                }
            }, function errorCallback(response) {
                $timeout(function () {
                    showProfileVm.voteMessage = '(Không kết nối được với server)';
                }, 5000);
            });
        } else {
            $timeout(function () {
                showProfileVm.voteMessage = '(Bạn cần đăng nhập để bình chọn)';
            }, 5000);
        }
    };

    /**
     * event when mouse hover on star icons
     * @param param
     */
    showProfileVm.mouseHoverStar = function (param) {
        showProfileVm.hoverRating = param;
    };

    /**
     * event when mouse leave off star icons
     * @param param
     */
    showProfileVm.mouseLeaveStar = function (param) {
        showProfileVm.hoverRating = param + '*';
    };
    //</editor-fold>

    showProfileVm.activateEmail = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'activateEmailModal.html',
            controller: 'activateEmailCtrl',
            controllerAs: 'activateEmailVm',
            keyboard: true,
            resolve: {
                email: function () {
                    return showProfileVm.email;
                }
            }
        });

        modalInstance.result.then(function (activated) {
            if (activated) {
                showProfileVm.activated = true;
            }
        });
    };

}]);
mainApp.controller('checkExistAnswerKeyCtrl', ['$scope', '$timeout', '$uibModalInstance', 'examData', function($scope, $timeout, $uibModalInstance,  examData){
    //modal to confirm finish creating exam by user
    var checkExistAnswerKeyVm = this; //view's model for detail controller

    checkExistAnswerKeyVm.close = function () {
        $uibModalInstance.close(false);
    };

    checkExistAnswerKeyVm.goNext = function () {
        $uibModalInstance.close(true);
    };

    checkExistAnswerKeyVm.checking = false;
    checkExistAnswerKeyVm.noSelectionQuestions = [];
    checkExistAnswerKeyVm.noAnswerKeyQuestions = [];
    checkExistAnswerKeyVm.check = function () {
        console.log(examData);

        checkExistAnswerKeyVm.checking = true;

        var nS = examData.sections.length;
        for(var i=0; i < nS; i++){
            var nQ = examData.sections[i]['questions'].length;
            for (var j=0; j < nQ; j++) {
                var questionType = examData.sections[i]['questions'][j].type;
                var nA = examData.sections[i]['questions'][j]['answers'].length - 1; //because always have pseudo answer
                if (nA <= 0) {
                    checkExistAnswerKeyVm.noSelectionQuestions.push({
                        id: examData.sections[i]['questions'][j].id,
                        order: examData.sections[i]['questions'][j].order
                    });
                } else {
                    switch (questionType) {
                        case 0: //single choice
                        case 1: //multiple choice
                            var haveAnswerKey = false;
                            for(var k=0; k < nA; k++) {
                                if (examData.sections[i]['questions'][j]['answers'][k].is_right) {
                                    haveAnswerKey = true;
                                    break;
                                }
                            }

                            if (!haveAnswerKey) {
                                checkExistAnswerKeyVm.noAnswerKeyQuestions.push({
                                    id: examData.sections[i]['questions'][j].id,
                                    order: examData.sections[i]['questions'][j].order
                                });
                            }
                            break;
                        case 2: //essay
                            if (examData.sections[i]['questions'][j]['answers'][0].description.length == 0) {
                                checkExistAnswerKeyVm.noAnswerKeyQuestions.push({
                                    id: examData.sections[i]['questions'][j].id,
                                    order: examData.sections[i]['questions'][j].order
                                });
                            }
                            break;
                        case 3: //matching type
                            //don't care, because always have answer key
                            break;
                    }
                }
            }
        }

        if (checkExistAnswerKeyVm.noSelectionQuestions.length == 0 && checkExistAnswerKeyVm.noAnswerKeyQuestions.length == 0) {
            //go continuously when exam is valid
            $timeout(function () {
                $uibModalInstance.close(true)
            });
            console.log('herre');
        }

        checkExistAnswerKeyVm.checking = false;
        console.log(checkExistAnswerKeyVm.noSelectionQuestions);
        console.log(checkExistAnswerKeyVm.noAnswerKeyQuestions);
    };
    checkExistAnswerKeyVm.check();
}]);
mainApp.controller('detailCtrl', ['$scope', '$document', '$timeout', '$compile', '$uibModal', 'displayHtmlService', 'SectionService', 'QuestionService', 'AnswerService', 'Upload', function($scope, $document, $timeout, $compile, $uibModal, displayHtmlService, SectionService, QuestionService, AnswerService, Upload){
    //examCreationCtrl Controller is parent
    //This use following variables:
    //  - statusMessage
    //  - id (exam id)

    //init Mathjax for display in detail panel only output to SVG type (not CHTML because user can drag and drop into equation and modify it)
    MathJax.Hub.Queue(["setRenderer", MathJax.Hub, "SVG"]);

    var detailVm = this; //view's model for detail controller
    detailVm.stopScroll = true; //use in scroll-drag directive

    detailVm.init = function (data) {
        detailVm.examId = data.examId;
        console.log(data);

        $timeout(detailVm.loadSections);
    };

    detailVm.loadSections = function () {
        //get all sections, question and answers of the exam
        SectionService.get({examId: detailVm.examId}, function successCallback(response) {
            detailVm.questionLoading = false;
            detailVm.loadedSections = response.sections;
            var nSection = detailVm.loadedSections.length;
            detailVm.questionExist = (nSection>0);

            //create order and loadedTinyMce flag for all question of exam
            //loadedTinyMce flag is used to check whether question/section is selected by user.
            //Because tinymce just load when user select question/section for improve performance
            var questionOrder = 0;
            for (var i = 0; i < nSection; i++) {
                var nQuestion = detailVm.loadedSections[i].questions.length;
                for (var j = 0; j < nQuestion; j++) {
                    questionOrder++;
                    detailVm.loadedSections[i].questions[j]['order'] = questionOrder;
                }
            }
        }, function errorCallback(response) {
            detailVm.questionLoading = false;
            detailVm.questionExist = false; //for displaying message is that "exam have not had questions yet."
            detailVm.loadedSections = [];
        });
    };

    detailVm.questionTypes = [
        {type: 0, label: 'o Loại một lựa chọn'}, //0
        {type: 1, label: '# Loại nhiều lựa chọn'}, //1
        {type:2, label: '~ Loại tự luận'}, //2
        {type:3, label: '- Loại so khớp'} //3
    ];

    detailVm.questionLoading = true; //for load question from database based on Ajax call
    detailVm.questionEditing = false; //for prevent user move item when editing
    detailVm.displayOptions = '0'; //show full section/question display in DOM

    //init sections variable, this variable will be loaded in loadExamQuestion directive
    detailVm.sections = []; //section is displayed on web page (infinite scrolling)
    detailVm.loadedSections = []; //sections is loaded to client
    detailVm.loadMoreSection = function() {
        //Infinite scroll in with ngInfiniteScroll
        var n = detailVm.loadedSections.length;
        if (detailVm.loadedSections.length - detailVm.sections.length > 10) {
            n = detailVm.sections.length + 10;
        }

        for (var i = detailVm.sections.length; i < n; i++) {
            detailVm.sections.push(detailVm.loadedSections[i]);
        }
    };

    //unselect any section/question when click outside
    $document.on('click', function() {
        if (angular.isDefined(detailVm.dragDrop) &&
            (detailVm.dragDrop.selectedSectionId != null ||
            detailVm.dragDrop.selectedQuestionId != null)) {
            $scope.$apply(function() {
                detailVm.dragDrop.selectedSectionId = null;
                detailVm.dragDrop.selectedSectionFooterId = null;
                detailVm.dragDrop.selectedQuestionId = null;
            });
        }
    });

    //clear string and render to HTML
    detailVm.renderHtml = function(html) {
        if (html == '') {
            html = '<p><br></p>'; //make description is exist, so it take space to display
        }
        return displayHtmlService.renderHtml(html);
    };

    //init variable use for angular-drap-drop-list and content editing panel (popup)
    detailVm.dragDrop = {
        selectedSectionId: null, //for display active DOM element
        selectedSectionFooterId: null, //It is section id, but for display add more question in group
        selectedQuestionId: null, //for display active DOM element
        selectedItem: null, //for update position
        selectedAnswer: null, //answer is special case, it does not have select effect, so it is processed specially.
        //backup selected item for use later because when lost focus, dragDrop.selectedItem will be set to null.
        //In the case displaying edit popup, it need return back item which selected before
        insertedPos: -1
    };


    //add more section/question/answer to exam
    //flag to show loading icon
    detailVm.creatingNewSingleSection = false;
    detailVm.creatingNewGroupSection = false;
    detailVm.creatingNewQuestion = false;
    detailVm.creatingNewAnswer = false;

    detailVm.insertedNewAnswer = false; //use to focus on new answer editor

    /**
     * user request creating new exam item
     * Depending item type (section single type (question), section group type, question, answer), make request suitable
     * @param itemType
     * @param sectionIdx
     * @param questionIdx
     */
    detailVm.addExamItem = function(itemType, sectionIdx, questionIdx) {
        angular.element('[data-toggle="tooltip"]').tooltip('hide');
        var createService = null;
        switch (itemType) {
            case 0: //section for single type
                detailVm.creatingNewSingleSection = true;
                createService = new SectionService({examId: detailVm.examId});
                createService['is_group_type'] = false;
                break;
            case 1: //section for group type
                detailVm.creatingNewGroupSection = true;
                createService = new SectionService({examId: detailVm.examId});
                createService['is_group_type'] = true;
                break;
            case 2: //question type
                detailVm.creatingNewQuestion = true;
                createService = new QuestionService({examId: detailVm.examId, sectionId: detailVm.sections[sectionIdx].id});
                break;
            case 3: //answer type
                detailVm.creatingNewAnswer = true;
                detailVm.insertedNewAnswer = true;
                var questionItem = detailVm.sections[sectionIdx].questions[questionIdx];
                if (questionItem.type == 2) { //essay question
                    return;
                }

                //convert pseudo answer to real and focus it
                var nAns = questionItem.answers.length;
                questionItem.answers[nAns-1].is_pseudo = false;
                console.log('insert answers');
                console.log(questionItem.answers[nAns-1].is_pseudo);
                console.log(detailVm.sections[sectionIdx].questions[questionIdx].answers[nAns-1].is_pseudo);
                $timeout(function() {
                    var element = angular.element('#ans_desc_' + questionItem.answers[nAns-1].id);
                    if (element) {
                        element.trigger('click');
                    }
                });

                createService = new AnswerService({examId: detailVm.examId, questionId: questionItem.id});
                break;
            default:
                return;
        }

        //post request
        createService.$save(function successCallback(response){
            detailVm.questionExist = true; //for the case when exam does not any question before.

            //add new into list
            switch (itemType) {
                case 0: //section type (single)
                    detailVm.creatingNewSingleSection = false;
                    if (response.success) {
                        detailVm.sections.push(response.section);
                        detailVm.updateQuestionOrder();

                        //focus on new section
                        detailVm.dragDrop.selectedSectionId = null;
                        detailVm.dragDrop.selectedSectionFooterId = null;
                        detailVm.dragDrop.selectedQuestionId = detailVm.sections[detailVm.sections.length-1].questions[0].id;
                        detailVm.dragDrop.selectedItem = detailVm.sections[detailVm.sections.length-1]; //for update position
                    } else {
                        $scope.examVm.statusMessage = response.message;
                        $timeout(function(){
                            $scope.examVm.statusMessage = '';
                        }, 2000);
                    }
                    break;
                case 1: //section type (group)
                    detailVm.creatingNewGroupSection = false;
                    if (response.success) {
                        detailVm.sections.push(response.section);
                        detailVm.updateQuestionOrder();

                        //focus on new section
                        detailVm.dragDrop.selectedSectionId = detailVm.sections[detailVm.sections.length-1].id;
                        detailVm.dragDrop.selectedSectionFooterId = detailVm.dragDrop.selectedSectionId;
                        detailVm.dragDrop.selectedQuestionId = null;
                        detailVm.dragDrop.selectedItem = detailVm.sections[detailVm.sections.length-1]; //for update position
                    } else {
                        $scope.examVm.statusMessage = response.message;
                        $timeout(function(){
                            $scope.examVm.statusMessage = '';
                        }, 2000);
                    }

                    break;
                case 2: //question type
                    detailVm.creatingNewQuestion = false;
                    if (response.success) {
                        detailVm.sections[sectionIdx].questions.push(response.question);
                        detailVm.updateQuestionOrder();

                        //focus on new question
                        detailVm.dragDrop.selectedSectionId = null;
                        detailVm.dragDrop.selectedSectionFooterId = detailVm.sections[sectionIdx].id;
                        detailVm.dragDrop.selectedQuestionId = detailVm.sections[sectionIdx].questions[detailVm.sections[sectionIdx].questions.length - 1].id;
                        detailVm.dragDrop.selectedItem = detailVm.sections[sectionIdx].questions[detailVm.sections[sectionIdx].questions.length - 1]; //for update position
                    } else {
                        $scope.examVm.statusMessage = response.message;
                        $timeout(function(){
                            $scope.examVm.statusMessage = '';
                        }, 2000);
                    }

                    break;
                case 3: //answer type
                    detailVm.creatingNewAnswer = false;
                    if (response.success) {
                        detailVm.sections[sectionIdx].questions[questionIdx].answers.push(response.answer);
                        console.log(response.answer);
                        console.log(detailVm.sections[sectionIdx].questions[questionIdx].answers);
                    } else {
                        $scope.examVm.statusMessage = response.message;
                        $timeout(function(){
                            $scope.examVm.statusMessage = '';
                        }, 2000);
                    }
                    break;
                default:
                    return;

            }
        }, function errorCallback(response){
            detailVm.creatingNewSingleSection = false;
            detailVm.creatingNewGroupSection = false;
            detailVm.creatingNewQuestion = false;
            detailVm.creatingNewAnswer = false;
            console.log('fail');
            console.log(response);
        });
    };

    /**
     * delete exam item
     * @param itemType
     * @param sectionIdx
     * @param questionIdx
     * @param answerIdx
     */
    detailVm.deleteExamItem = function(itemType, sectionIdx, questionIdx, answerIdx) {
        var deleteService = null;
        switch (itemType) {
            case 0: //section for single type
            case 1: //section for group type
                deleteService = new SectionService({examId: detailVm.examId,
                    sectionId: detailVm.sections[sectionIdx].id});
                detailVm.sections.splice(sectionIdx, 1);
                detailVm.loadedSections.splice(sectionIdx, 1); //must deleted in list for infinite scrolling
                detailVm.updateQuestionOrder();
                break;
            case 2: //question type
                deleteService = new QuestionService({examId: detailVm.examId, sectionId: detailVm.sections[sectionIdx].id,
                    questionId: detailVm.sections[sectionIdx].questions[questionIdx].id});
                detailVm.sections[sectionIdx].questions.splice(questionIdx, 1);
                detailVm.updateQuestionOrder();
                break;
            case 3: //answer type
                var questionItem = detailVm.sections[sectionIdx].questions[questionIdx];
                if (questionItem.type == 2) { //essay question
                    return;
                }
                deleteService = new AnswerService({examId: detailVm.examId, questionId: questionItem.id,
                    answerId: questionItem.answers[answerIdx].id});
                detailVm.sections[sectionIdx].questions[questionIdx].answers.splice(answerIdx, 1);
                break;
            default:
                return;
        }

        //send DELETE request
        deleteService.$remove(function successCallback(response){
            $scope.examVm.statusMessage = '';
        }, function errorCallback(response){
            $scope.examVm.statusMessage = 'Server không thực hiện lệnh xóa được.';
        });
    };

    detailVm.focusQuestionGrade = function (sectionIdx, questionIdx) {
        detailVm.questionEditing = true;
        detailVm.sections[sectionIdx].questions[questionIdx].gradeEditing = true;
    };

    detailVm.blurQuestionGrade = function (sectionIdx, questionIdx) {
        detailVm.questionEditing = false;
        detailVm.sections[sectionIdx].questions[questionIdx].gradeEditing = false;
    };

    detailVm.focusQuestionTimer = function (sectionIdx, questionIdx) {
        detailVm.questionEditing = true;
        detailVm.sections[sectionIdx].questions[questionIdx].timerEditing = true;
    };

    detailVm.blurQuestionTimer = function (sectionIdx, questionIdx) {
        detailVm.questionEditing = false;
        detailVm.sections[sectionIdx].questions[questionIdx].timerEditing = false;
    };


    //update grade and duration of question
    detailVm.updateQuestionGradeDuration = function (sectionId, questionId, fieldName, data) {
        $scope.examVm.statusMessage = 'Đang lưu...';
        //create new question service ($resource) to send to server
        var question = new QuestionService({examId: detailVm.examId, sectionId: sectionId, questionId: questionId});
        question[fieldName] = data;

        //post updated data
        question.$update(function successCallback(response){
            $scope.examVm.statusMessage = '';
        }, function errorCallback(response){
            if (response.status == 422) {
                $scope.examVm.statusMessage = 'Dữ liệu không hợp lệ...';

                $timeout(function(){
                    $scope.examVm.statusMessage = '';
                }, 5000);
            }
        });
    };

    //change question type
    detailVm.currentQuestionType = 0;
    detailVm.changingQuesType = false;
    detailVm.changeQuestionType = function (sectionIdx, questionIdx) {
        detailVm.changingQuesType = true; //lock other change

        var question = new QuestionService({examId: detailVm.examId, sectionId: detailVm.sections[sectionIdx].id,
            questionId: detailVm.sections[sectionIdx].questions[questionIdx].id});
        question['type'] = detailVm.currentQuestionType.type;

        var questionType = detailVm.currentQuestionType.type; //use for callback function and prevent user choose another before server update

        //send updat type request
        question.$updateType(function successCallback(response){
            var nAnswer, i;
            detailVm.sections[sectionIdx].questions[questionIdx].type = questionType;
            detailVm.sections[sectionIdx].questions[questionIdx].ans_right = ''; //this variable is used in single choice input radio
            nAnswer = detailVm.sections[sectionIdx].questions[questionIdx].answers.length;
            for(i=0; i < nAnswer; i++) {
                detailVm.sections[sectionIdx].questions[questionIdx].answers[i].is_right = false;
            }

            //special case: question type is essay
            if (nAnswer == 1 && questionType == 2) {
                detailVm.sections[sectionIdx].questions[questionIdx].answers[0].is_pseudo = false;
                detailVm.sections[sectionIdx].questions[questionIdx].answers.push(response.answer);
            }

            detailVm.changingQuesType = false; //release lock

        }, function errorCallback(response){
            detailVm.changingQuesType = false; //release lock
            $scope.examVm.statusMessage = 'Không cập nhật được...';
        });
    };

    /**
     * Update correct answer in single or multiple choice question
     * @param type
     * @param questionId
     * @param answerId
     * @param value
     */
    detailVm.updateCorrectAnswer = function (type, questionId, answerId, value) {
        var answer = new AnswerService({examId: detailVm.examId, questionId: questionId, answerId: answerId});
        answer['type'] = type;
        answer['value'] = value;

        answer.$updateCorrectAnswer(function successCallback(response){
            $scope.examVm.statusMessage = 'Đã lưu';
            $timeout(function(){
                $scope.examVm.statusMessage = '';
            }, 2000);
        }, function errorCallback(response){
            $scope.examVm.statusMessage = 'Dữ liệu không cập nhật được...';
        });
    };

    //<editor-fold desc="update section/question position">
    detailVm.draggingAnswer = false; //flag to disable edit answer when dragging. It prevent user drag item into other item's editor

    /**
     * Remember selected item
     * @param sectionItem
     * @param questionItem
     * @param answerItem
     */
    detailVm.selectItem = function(sectionItem, questionItem, answerItem) {
        if (sectionItem.is_group_type && questionItem == null) {
            //section is selected
            detailVm.dragDrop.selectedSectionId = sectionItem.id;
            detailVm.dragDrop.selectedSectionFooterId = sectionItem.id;
            detailVm.dragDrop.selectedQuestionId = null;
            detailVm.dragDrop.selectedItem = sectionItem; //for update position
        } else {
            //question is selected
            detailVm.dragDrop.selectedSectionId = null;
            detailVm.dragDrop.selectedSectionFooterId = null;
            if (questionItem == null) {
                detailVm.dragDrop.selectedQuestionId = sectionItem.questions[0].id;
                detailVm.dragDrop.selectedItem = sectionItem; //for update position
            } else {
                detailVm.dragDrop.selectedSectionFooterId = sectionItem.id;
                detailVm.dragDrop.selectedQuestionId = questionItem.id;
                detailVm.dragDrop.selectedItem = questionItem; //for update position
                //detailVm.currentQuestionType = detailVm.questionTypes[questionItem.type];
            }
        }

        //answer is selected
        if (answerItem != null) {
            detailVm.dragDrop.selectedAnswer = answerItem; //for update position
            detailVm.draggingAnswer = true;
        }
    };

    //save inserted section/question position
    detailVm.saveInsertedPosition = function (index){
        detailVm.dragDrop.insertedPos = index;
    };

    /**
     * Update section/question postion
     * @param is_section
     * @param sectionIdx
     */
    detailVm.updatePosition = function(is_section, sectionIdx){
        //autoscroll
        detailVm.stopScroll = true; //important: must stop scroll when finish

        //notes that:
        //item's position is count base on 1 and position in dnd-drag is count base on 0
        //dnd-drag did not delete item before dnd-move (manually),
        //so inserted position is special
        //  + If drag with no change position then inserted position is equal current position or more than one
        //  + If drag go up then inserted position is equal position which will inserted
        //  + If drag go down then inserted position is more than one compare which position which will inserted
        //and item list in this step is cleared by dnd-move
        //For example:
        //  0
        //  1   --> move it
        //  2
        //  3
        //Case 1: move near 0 --> no change
        //  inserted position: 1
        //Case 2: move near 2 --> no change
        //  inserted position: 2
        //Case 3: move over 0
        //  inserted position: 0
        //Case 4: move over 2
        //  inserted position: 3

        //check valid position
        var originalItemPos = (detailVm.dragDrop.selectedItem == null) ? -1 : detailVm.dragDrop.selectedItem.position - 1; //convert to base 1
        var insertedPos = detailVm.dragDrop.insertedPos;

        if ((is_section && detailVm.sections == null)
            || (!is_section && (angular.isUndefined(detailVm.sections[sectionIdx]) || detailVm.sections[sectionIdx].questions == null))
            || insertedPos == null
            || originalItemPos < 0 || insertedPos < 0
            || originalItemPos == insertedPos || originalItemPos == insertedPos - 1) {
            return;
        }


        //lock drag-drop
        //detailVm.dragDrop.updating = true;
        detailVm.questionEditing = true;

        //change section's order: insertedPos < originalItemPos it means drag item go up and otherwise
        var begin = insertedPos < originalItemPos ? insertedPos : originalItemPos;
        var end = insertedPos < originalItemPos ? originalItemPos : insertedPos - 1; //because insert pos is setted before selected item is removed of array
        var itemsPosition = {};

        for (var i = begin; i <= end; i++) {
            if (is_section) {
                detailVm.sections[i].position = i + 1; //convert back to base 1
                var sectionId = detailVm.sections[i].id;
                itemsPosition[sectionId] = detailVm.sections[i].position;
            } else {
                detailVm.sections[sectionIdx].questions[i].position = i + 1; //convert back to base 1
                var questionId = detailVm.sections[sectionIdx].questions[i].id;
                itemsPosition[questionId] = detailVm.sections[sectionIdx].questions[i].position;
            }
        }

        //update order for all question of exam
        detailVm.updateQuestionOrder();

        $scope.examVm.statusMessage = 'Đang lưu...';
        var updateService = (is_section) ?
            new SectionService({examId: detailVm.examId}) : new QuestionService({examId: detailVm.examId, sectionId: detailVm.sections[sectionIdx].id});
        updateService['positions'] = itemsPosition;
        updateService.$updatePosition(function successCallback(response){
            $scope.examVm.statusMessage = '';
            //unlock
            detailVm.questionEditing = false;
        }, function errorCallback(response) {
            if (response.status == 422) {
                $scope.examVm.statusMessage = 'Dữ liệu không hợp lệ...';

                $timeout(function(){
                    $scope.examVm.statusMessage = '';
                }, 5000);
            }
        });
    };

    /**
     * update order for all question of exam after change item position
     */
    detailVm.updateQuestionOrder = function() {
        //update order for all question of exam
        var questionOrder = 0;
        var nSection = detailVm.sections.length;
        for (var i = 0; i < nSection; i++) {
            var nQuestion = detailVm.sections[i].questions.length;
            for (var j = 0; j < nQuestion; j++) {
                questionOrder++;
                detailVm.sections[i].questions[j]['order'] = questionOrder;
            }
        }
    };

    /**
     * update answer position
     * @param sectionIdx
     * @param questionIdx
     */
    detailVm.updateAnswerPosition = function(sectionIdx, questionIdx) {
        //autoscroll
        detailVm.stopScroll = true; //important: must end scroll when finish scroll

        detailVm.draggingAnswer = false;

        var originalItemPos = (detailVm.dragDrop.selectedAnswer == null) ? -1 : detailVm.dragDrop.selectedAnswer.position - 1; //convert to base 1
        var insertedPos = detailVm.dragDrop.insertedPos;

        //check valid position
        if (insertedPos == null
            || originalItemPos < 0 || insertedPos < 0
            || originalItemPos == insertedPos || originalItemPos == insertedPos - 1) {
            return;
        }

        //lock drag-drop
        detailVm.questionEditing = true;

        //change answer's order: insertedPos < originalItemPos it means drag item go up and otherwise
        var begin = insertedPos < originalItemPos ? insertedPos : originalItemPos;
        var end = insertedPos < originalItemPos ? originalItemPos : insertedPos - 1; //because insert pos is setted before selected item is removed of array
        var itemsPosition = {};

        for (var i = begin; i <= end; i++) {
            detailVm.sections[sectionIdx].questions[questionIdx].answers[i].position = i + 1; //convert back to base 1
            var answerId = detailVm.sections[sectionIdx].questions[questionIdx].answers[i].id;
            itemsPosition[answerId] = detailVm.sections[sectionIdx].questions[questionIdx].answers[i].position;
        }

        $scope.examVm.statusMessage = 'Đang lưu...';
        var updateService = new AnswerService({examId: detailVm.examId, questionId: detailVm.sections[sectionIdx].questions[questionIdx].id});
        updateService['positions'] = itemsPosition;
        updateService.$updatePosition(function successCallback(response){
            $scope.examVm.statusMessage = '';
            //unlock
            detailVm.questionEditing = false;
        }, function errorCallback(response) {
            if (response.status == 422) {
                $scope.examVm.statusMessage = 'Dữ liệu không hợp lệ...';

                $timeout(function(){
                    $scope.examVm.statusMessage = '';
                }, 5000);
            }
        });
    };
    //</editor-fold>

    //update description of section, question, answer, or match
    //when init, tinymce will fire change on ng-model,
    //so it can send to server data which not change
    //therefore, we create a flag to know init and user did not type any thing. However, this way is fail. Check document 31/5/2016
    detailVm.updateDescription = function(parentItem, item, type) {
        console.log(item.description);
        var description = item.description;
        if (type == 3) {
            //match
            description = item.match;
        }

        //clear mathjax compiled script
        var descriptionElm = $('<div />').append(description);
        descriptionElm.find('script').replaceWith(function(){
            var scriptMath = $(this).html().replace("// <![CDATA[", "").replace("// ]]>", "").trim();
            var blockDisplay = $(this).attr('type');
            if (typeof blockDisplay !== "undefined" && blockDisplay=="math/tex; mode=display") {
                scriptMath = '$$' + scriptMath + '$$';
            } else {
                scriptMath = '\\(' + scriptMath + '\\)&amp; zwnj;'; //inline
            }
            return scriptMath;
        });
        descriptionElm.find('.MathJax_SVG_Display, .MathJax_SVG, .editMath').remove();
        description = descriptionElm.html();
        description = description.replace(/&amp; zwnj;/g,"&zwnj;"); //preserve zero-width non joiner
        description = description.replace(/[\n\t]+/g,""); //remove all newline

        if (detailVm.checkLengthOverLimit(description)) {
            return ;
        }

        $scope.examVm.statusMessage = 'Đang lưu...';
        //create new question service ($resource) to send to server
        var updateService = null;
        switch (type) {
            case 0: //section type
                updateService = new SectionService({examId: detailVm.examId, sectionId: item.id});
                updateService['description'] = description;
                break;
            case 1: //question type
                updateService = new QuestionService({examId: detailVm.examId, sectionId: parentItem.id, questionId: item.id});
                updateService['description'] = description;
                break;
            case 2: //answer type
                updateService = new AnswerService({examId: detailVm.examId, questionId: parentItem.id, answerId: item.id});
                updateService['description'] = description;
                break;
            case 3: //match type
                updateService = new AnswerService({examId: detailVm.examId, questionId: parentItem.id, answerId: item.id});
                updateService['match'] = description;
                break;
            default: return;
        }

        updateService.$update(function successCallback(response){
            $scope.examVm.statusMessage = '';
        }, function errorCallback(response){
            if (response.status == 422) {
                $scope.examVm.statusMessage = 'Dữ liệu không hợp lệ...';

                $timeout(function(){
                    $scope.examVm.statusMessage = '';
                }, 5000);
            }
        });
    };

    //<editor-fold desc="tinymce editor setting">
    detailVm.trickLoadTinymce = ''; //'preload tinymce setting. Later tinymce will load faster. (trick)'

    //load tinymce editor when click on item's description
    detailVm.loadTinyMce = function(event, currentItem, parentItem, type) {
        var elem = angular.element(event.currentTarget || event.srcElement);
        var tinymceDiv;
        //Notes: must include debounce, because when user blur too fast, it can make modal is not updated
        if (type != 3) {
            tinymceDiv = angular.element('<div class="contenteditable" ng-focus="' + currentItem +
                '.underlineCss=\'cq-exam-add-underline\'" ng-blur="' + currentItem +
                '.underlineCss=\'cq-exam-remove-underline\'" ui-tinymce="::detailVm.editorSettings" ng-model="' + currentItem +
                '.description" ng-model-options="{updateOn:\'default blur\', debounce: {\'default\': 2000, \'blur\': 0}}" ng-change="detailVm.updateDescription(' + parentItem +
                ', ' + currentItem + ', ' + type + ')"></div>');
        } else {
            //match description
            tinymceDiv = angular.element('<div class="contenteditable" ng-focus="' + currentItem +
                '.underlineCssMatch=\'cq-exam-add-underline\'" ng-blur="' + currentItem +
                '.underlineCssMatch=\'cq-exam-remove-underline\'" ui-tinymce="::detailVm.editorSettings" ng-model="' + currentItem +
                '.match" ng-model-options="{updateOn:\'default blur\', debounce: {\'default\': 2000, \'blur\': 0}}" ng-change="detailVm.updateDescription(' + parentItem +
                ', ' + currentItem + ', ' + type + ')"> </div>');
        }

        tinymceDiv.insertAfter(elem);

        var scope = elem.scope();
        elem.remove();
        $compile(tinymceDiv)(scope);
    };

    var customMenubar = "edit insert format table tools help"; //fullscreen not support in inline mode, preview make problem when use MathJax
    var customToolbar = "fontselect | fontsizeselect | forecolor backcolor |" +
        " alignleft aligncenter alignright alignjustify |" +
        " bullist numlist indent outdent | table | image media |" +
        " code | mathtype";

    //init tiny editor settings
    detailVm.editorSettings = {
        language_url : '/js/tinymce-v451/langs/vi.js',
        external_plugins: {
            'advlist': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/advlist/plugin.min.js',
            'link': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/link/plugin.min.js',
            'image': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/image/plugin.min.js',
            'imagetools': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/imagetools/plugin.min.js',
            'lists': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/lists/plugin.min.js',
            'charmap': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/charmap/plugin.min.js',
            'hr': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/hr/plugin.min.js',
            'searchreplace': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/searchreplace/plugin.min.js',
            'media': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/media/plugin.min.js',
            'table': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/table/plugin.min.js',
            'contextmenu': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/contextmenu/plugin.min.js',
            'paste': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/paste/plugin.min.js',
            'textcolor': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/textcolor/plugin.min.js',
            'colorpicker': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/colorpicker/plugin.min.js',
            'autoresize': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/autoresize/plugin.min.js',
            'template': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/template/plugin.min.js',
            'code': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/code/plugin.min.js'
        },
        inline: true,
        trusted: true, // all TinyMCE content that is set to ngModel will be whitelisted by $sce
        theme: "modern",
        language: 'vi',
        plugins: [
            "advlist link image imagetools lists charmap hr",
            "searchreplace media",
            "table contextmenu paste textcolor colorpicker",
            "autoresize template code"
        ], //don't use code plugin, because MathJax script will modified
        contextmenu: "cut copy paste | link image inserttable | cell row column deletetable",
        menu: {
            edit: {title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall | searchreplace'},
            insert: {title: 'Insert', items: 'image media link | charmap hr template | mathtype'},
            format: {title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat'},
            table: {title: 'Table', items: 'inserttable tableprops deletetable | cell row column'},
            tools: {title: 'Tools', items: 'code'},
            help: {title: 'Help', items: 'editorhelp mathtypehelp'}
        },
        menubar: customMenubar,
        toolbar: customToolbar,
        table_default_styles: {
            width: '100%'
        },
        statusbar: false,
        fontsize_formats: '8pt 10pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 32pt 36pt 48pt 72pt',
        custom_undo_redo_levels: 10,
        image_advtab: true,
        relative_urls: false,
        remove_script_host: false,
        convert_urls : true,
        //paste_retain_style_properties: "color font-weight text-align text-decoration border background float display",
        content_css: ["/css/bootstrap.min.css?" + new Date().getTime()],
        entity_encoding: 'raw', //for optimize speed
        //entities: '8204, zwnj', //must have space after comma
        templates: [
            {title: 'Tiêu đề nhóm', description: 'Thực hiện tiêu đề cho một nhóm câu hỏi', content: '<p style="font-size: 22px; font-weight: bold;">Nội dung điền vào đây</p>'},
            {title: 'Câu hỏi', description: 'Thể hiện nội dung câu hỏi', content: '<p style="font-size: 18px; font-weight: normal;">Đây là câu hỏi ...</p>'},
            {title: 'Các lựa chọn', description: 'Thể hiện các lựa chọn', content: '<p style="font-size: 16px; font-weight: normal;">Đây là các lựa chọn ...</p>'},
        ],
        file_picker_callback: function (callback, value, meta){
            if (meta.filetype == 'image') {
                tinymce.activeEditor.windowManager.open({
                    title: 'Đăng Tải Hình',
                    url: '/u/image/exam/' + detailVm.examId,
                    width: 650,
                    height: 470
                }, {
                    oninsert: function (url) {
                        callback(url);
                        //detailVm.initTinyMceWithNoChange = false; //user interacted with editor. if user init tinymce and add new image, it must be saved.
                    }
                });
            }
        },
        file_picker_types: 'image',
        images_upload_handler: function(blobInfo, success, failure) {
            var file = new File([blobInfo.blob()], blobInfo.filename());

            //resize and convert image before upload to server
            Upload.imageDimensions(file).then(function(dimensions){
                if (dimensions.width > 1920 || dimensions.height > 1200) {
                    Upload.resize(file, 1920, 1200, .8, 'image/jpeg').then(function(resizedFile){
                        file = resizedFile;
                    });
                }
            });

            //upload image to server
            Upload.upload({
                url: '/u/image/exam/' + detailVm.examId,
                data: {image: file}
            }).then(function successCallback(response) {
                var imageUrl = '/image/' + response.data.imageName;
                success(imageUrl);
            }, function errorCallback(resp) {
                failure('Update image failure');
            }, function progressCallback(evt) {
                //imageVm.progressImageUpload = parseInt(90.0 * evt.loaded / evt.total);
            });
        },
        extended_valid_elements: '*[*]', //allow because of inserting math equation with block div (when insert, it auto delete all previous script)
        //extended_valid_elements: 'script[*]',
        // , g[*], use[*], rect[*]',
        //custom_elements: '~svg, ~g, ~use, ~rect',
        //valid_childern: '+svg[g]',
        setup: function(editor) {
            editor.addMenuItem('editorhelp', {
                text: 'Editor guide',
                context: 'help',
                onclick: function() {
                    editor.windowManager.open({
                        title: 'Hướng dẫn soạn thảo',
                        url: '/guide/editor?tinymce=1',
                        width: 800,
                        height: 570
                    });
                }
            });
            editor.addMenuItem('mathtypehelp', {
                text: 'Mathtype guide',
                context: 'help',
                onclick: function() {
                    editor.windowManager.open({
                        title: 'Hướng dẫn gõ công thức',
                        url: '/guide/mathtype?tinymce=1',
                        width: 800,
                        height: 570
                    });
                }
            });

            function loadMathType() {
                editor.windowManager.open({
                    title: 'Công thức',
                    url: '/u/mathtype',
                    width: 700, //no bigger because windows not change when browser change size, or if screen is smaller, can not scroll to see
                    height: 600
                }, {
                    oninsert: function (equation, blockDisplay) {
                        //detailVm.initTinyMceWithNoChange = false; //user interacted with editor. if user init tinymce and add new image, it must be saved.

                        //make sure that math equation in template
                        var formattedEquation;
                        //&#8203; -> zero-width space can not be used because when undo/redo tinymce auto delete
                        if (blockDisplay) {
                            formattedEquation = '<div class="math">' +
                                    //'<span>&#8203;</span>' +
                                '$$' + equation + '$$' +
                                    //'<span class="scriptMath" style="display:none">' +
                                    //'$$' + equation + '$$' +
                                    //'</span>' +
                                '</div>' + '<p></p>';
                        } else {
                            //zero-width non-joined placed in math element and previous equation
                            //this make image when drag into before math element and drag next, equation will did not disappear
                            formattedEquation =
                                '&nbsp;' +         //prevent delete equation when delete before character
                                '\\(' + equation + '\\)' +
                                '&#8204;&nbsp;';
                            //zero-width non-joined placed in last and out math element,
                            //this make user can not go into equation and type continue
                        }

                        editor.insertContent(formattedEquation, null);
                        MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id]); //refresh MathJax
                    }
                });
            }

            editor.addMenuItem('mathtype', {
                text: 'Công thức',
                context: 'insert',
                //icon: 'sigma',
                onclick: function() {
                    loadMathType();
                }
            });

            editor.addButton("mathtype", {
                text: 'Công thức',
                tooltip: "Gõ công thức toán, hóa học",
                icon: false,
                onclick: function() {
                    loadMathType();
                }
            });

            editor.on('init', function() {
                editor.isSavedContent = true;
                editor.selectedMathId = null;
                editor.selectedMathDisplay = false; //true is display block
                editor.moveNext = true;
                editor.pressSpace = false;
                editor.beginInlineMath = false;
                editor.endInlineMath = false;
                editor.runMathJax = false;

                //refresh when init math (use in the case user move to other place)
                $('#' + editor.id).find('.scriptMath').each(function(){
                    var scriptMath = $(this).html();
                    $(this).before(scriptMath);
                });
                MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id]);

                //focus editor on load/init
                if (detailVm.insertedNewAnswer) {
                    //for new inserted item
                    editor.focus();
                    detailVm.insertedNewAnswer = false; //reset flag
                    //select all current text
                    var range = editor.dom.createRng();
                    range.selectNodeContents(editor.getBody());
                    editor.selection.setRng(range);
                } else {
                    editor.focus();
                }

                //when init, tinymce will fire change on ng-model,
                //so it can send to server data which not change
                //therefore, we create a flag to know init and user did not type any thing
                //However, I can not detect when user click on format menu item, so this method is fail (31/5/2016)
                //detailVm.initTinyMceWithNoChange = true;
            });

            editor.on('change', function() {
                if (editor.endInlineMath) {
                    editor.endInlineMath = false; //must before insert space (execCommand)
                    editor.runMathJax = true;
                    editor.execCommand('mceInsertContent', false, "&zwnj;"); //will call change event again
                } else if (editor.runMathJax) {
                    editor.runMathJax = false;
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id]);
                }
            });

            editor.on('blur', function(){
                detailVm.questionEditing = false;
                //Khong duoc chinh sua math o day vi khi click vao math no vua thuc hien lost focus (blur) vua focus
            });

            editor.on('click', function(e) {
                //math equation in template is same as mathtype plugin

                detailVm.questionEditing = true;
                var currentElm = $(e.target);

                //check if node is clicked is mathjax SVG, create editing math element
                var mathJaxNode = currentElm.closest('.MathJax_SVG');

                if (mathJaxNode.length > 0) {
                    //if user is staying the equation, after that go into other equation,
                    //we convert the equation to SVG before edit new selected equation
                    if (editor.selectedMathId != null && mathJaxNode.attr('id') != editor.selectedMathId)
                    {
                        var editMathElm = $('.editMath'); //find edit math element
                        if (editMathElm.length > 0) {
                            var text = editMathElm.html();
                            //editMathElm.next('script').html(text);

                            if (editor.selectedMathDisplay) {
                                var blockElm2 = editMathElm.closest('.MathJax_SVG_Display');
                                blockElm2.replaceWith('$$' + text + '$$');
                            } else {
                                editMathElm.replaceWith('\\(' + text + '\\)');
                            }
                            MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id], function() {
                                //callback function is called after convert previous math element
                                //It create editing math element
                                editor.selectedMathId = mathJaxNode.attr('id');

                                //get raw equation and remove script tag of MathJax
                                var scriptElm, originalText;

                                var blockElm = currentElm.closest('.MathJax_SVG_Display');
                                if (blockElm.length > 0) {
                                    //if equation is block display, it have div outside to make style center align
                                    //so go up one level to get script element
                                    scriptElm = blockElm.next('script');
                                } else {
                                    scriptElm = mathJaxNode.next('script');
                                }
                                originalText = scriptElm.html();
                                editor.selectedMathDisplay = (scriptElm.attr('type').indexOf('mode=display') > -1);
                                scriptElm.remove();

                                //insert editing math element
                                mathJaxNode.after('<span class="editMath" id="editMath_' + editor.selectedMathId + '" style="border: 1px solid red; padding: 2px 2px;">' + originalText + '</span>');
                                mathJaxNode.remove();
                            });
                        }
                    } else {
                        //create editing math element
                        editor.selectedMathId = mathJaxNode.attr('id');

                        //get raw equation and remove script tag of MathJax
                        var scriptElm, originalText;

                        var blockElm = currentElm.closest('.MathJax_SVG_Display');
                        if (blockElm.length > 0) {
                            //if equation is block display, it have div outside to make style center align
                            //so go up one level to get script element
                            scriptElm = blockElm.next('script');
                        } else {
                            scriptElm = mathJaxNode.next('script');
                        }
                        originalText = scriptElm.html();
                        editor.selectedMathDisplay = (scriptElm.attr('type').indexOf('mode=display') > -1);
                        scriptElm.remove();

                        //insert editing math element
                        mathJaxNode.after('<span class="editMath" id="editMath_' + editor.selectedMathId + '" style="border: 1px solid red; padding: 2px 2px;">' + originalText + '</span>');
                        mathJaxNode.remove();
                    }

                }
                //else {
                //    //Node change event detect if user clic out of editting math
                //    //so don't need do any thing here
                //}
            });

            editor.on('NodeChange', function(e){
                var currentElm = $(e.element);

                //move image out of math element if it is being inside when user drag and drop image
                var mathElm = currentElm.closest('.MathJax_SVG_Display'); //block display math
                if (mathElm.length == 0) {
                    mathElm = currentElm.closest('.MathJax_SVG'); //inline display math
                }
                if (mathElm.length > 0) {
                    var imgNode = mathElm.find('img');
                    if (imgNode.length > 0) {
                        imgNode.remove();
                        mathElm.before(imgNode);
                        mathElm.before('&zwnj;');
                    }
                }

                var editingMathElm = currentElm.closest('.editMath');
                if (editingMathElm.length == 0 && editor.selectedMathId != null) {
                    //if current element is not editing math element and previous selected is editing math element,
                    //make previous to math display
                    //In other word, when node change and is not editing math node,
                    //if previous node is math, add symbol to equation. After that, MathJax will convert it to SVG
                    var editMathElm = $('.editMath'); //get all editing math node if any
                    if (editMathElm.length > 0) {
                        editor.selectedMathId = null; //clear selected math node

                        var text = editMathElm.html();
                        if (editor.selectedMathDisplay) {
                            var blockElm = editMathElm.closest('.MathJax_SVG_Display');

                            blockElm.replaceWith('$$' + text + '$$'); //add special symbol
                        } else {
                            editMathElm.replaceWith('\\(' + text + '\\)'); //add special symbol
                        }
                        MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id]); //refresh MathJax
                    }
                }

                if (mathElm.length > 0 && editingMathElm.length == 0) {
                    //if caret in math area and status is not editing,
                    //move caret out equation
                    var range, sel = rangy.getSelection();
                    range = rangy.createRange();
                    var mathNodeHtml;
                    if (editor.moveNext == true) {
                        mathNodeHtml = mathElm[0].nextSibling.nextSibling; //over script tag
                        //console.log(mathNodeHtml);
                        if (mathNodeHtml == null) {
                            mathNodeHtml = mathElm[0].parentNode.nextSibling.firstChild;
                        }
                        //if it is not text node, find first text node in childs
                        if (mathNodeHtml.nodeType != Node.TEXT_NODE) {
                            var childNodes = mathNodeHtml.childNodes;
                            for(var i = 0; i < childNodes.length; i++) {
                                var child = childNodes[i];
                                if (child.nodeType == 3) {
                                    mathNodeHtml = child;
                                    break;
                                }
                            }
                        }
                        //if equation is inline, move over non-width space which put at the following.
                        var moveOverNonWidthSpace = 0;
                        if (mathNodeHtml.nodeType == Node.TEXT_NODE
                            && mathNodeHtml.wholeText.charCodeAt(0) === 8204) {
                            moveOverNonWidthSpace = 1;
                        }
                        range.setStart(mathNodeHtml, moveOverNonWidthSpace);
                        range.setEnd(mathNodeHtml, moveOverNonWidthSpace);
                    } else {
                        mathNodeHtml = mathElm[0].previousSibling;
                        if (mathNodeHtml == null) {
                            mathNodeHtml = mathElm[0].parentNode.previousSibling.lastChild;
                        }
                        //if it is not text node, find last text node in childs
                        if (mathNodeHtml.nodeType != Node.TEXT_NODE) {
                            for(var nodes = mathNodeHtml.childNodes, j = nodes.length; j--;) {
                                var node = nodes[j];
                                if (node.nodeType == 3) {
                                    mathNodeHtml = node;
                                    break;
                                }
                            }
                        }
                        range.setStart(mathNodeHtml, mathNodeHtml.length);
                        range.setEnd(mathNodeHtml, mathNodeHtml.length);
                    }
                    //apply this range to the selection object
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            });

            editor.on('KeyDown', function(e) {
                editor.isSavedContent = false;

                editor.moveNext = (e.key == "ArrowRight" || e.key == 'Right'); //move next. Otherwise, move previous
                editor.endInlineMath = (e.key == ')'); //add zwnj; after ) for inline math on change event
                editor.runMathJax = (e.key == ']') || (e.key == '$'); //process Mathjax when key press is ] or $. For ), use endInlineMath

                //check length limit
                var control_keys = ['Backspace', 'Enter', 'Shift', 'Control', 'Alt', 'CapsLock', 'PageUp', 'PageDown',
                    'End', 'Home', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Delete', 'Left', 'Up', 'Right', 'Down', 'Del'];
                if(control_keys.indexOf(e.key) == -1){
                    //detailVm.initTinyMceWithNoChange = false; //user interacted with editor

                    var chars_with_html = editor.getContent().length;

                    if (detailVm.checkLengthOverLimit(chars_with_html)) {
                        editor.stopPropagation();
                        editor.preventDefault();
                        return false;
                    }
                }

                //insert space before backslash
                //must after check length limit
                if (e.key == '\\' && !editor.pressSpace) { // is \
                    editor.execCommand('mceInsertContent', false, " \\"); //will call change event again
                    editor.preventDefault();
                    editor.stopPropagation();
                    editor.pressSpace = true; //if press more than one backslash, not insert space before
                    return false;
                }

                //flag for insert space before begin math equation if any in the next time
                editor.pressSpace = (e.key == ' ' || e.key == '\\');
            });
        }
    };

    /**
     * Check user paste or type data with length over limit
     * @param chars_with_html
     * @returns {boolean}
     */
    detailVm.checkLengthOverLimit = function (chars_with_html) {
        //limit of column in mySQL 65536 ~ 21844 chars in UTF-8
        //because editor include html tag, ..., so for safe, use it for 20000 chars
        var max_length = 20000;

        if (chars_with_html > max_length){
            $scope.examVm.statusMessage = 'Chiều dài vượt giới hạn!';
            return true;
        } else {
            $scope.examVm.statusMessage = '';
            return false;
        }
    };
    //</editor-fold>

    //listen event from examCreationCtrl for check any questions don't have answer key
    $scope.$on('checkAnswerKey', function (e){
        if (angular.isDefined(detailVm.sections) && detailVm.sections.length > 0) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'checkExistAnswerKeyModal.html',
                controller: 'checkExistAnswerKeyCtrl',
                controllerAs: 'checkExistAnswerKeyVm',
                keyboard: false,
                resolve: {
                    examData: function () {
                        return {
                            sections: detailVm.sections
                        };
                    }
                }
            });

            //store publish status if changed
            modalInstance.result.then(function (goNext) {
                //emit event to examCreationCtrl
                $scope.$emit('afterCheck', goNext);
            });
        } else {
            $scope.$emit('afterCheck', true);
        }
    });
}]);
mainApp.controller('examCreationCtrl', ['$scope', '$timeout', '$uibModal', '$window', 'Upload', 'ExamService', 'PrintingService', function($scope, $timeout, $uibModal, $window, Upload, ExamService, PrintingService){
    var examVm = this; //view's model in exam creation controller

    examVm.unSavedList = {}; //use for send update again when click finish button
    examVm.statusMessage = '';  //status message string
    examVm.collapse = false;    //collapse exam information section in DOM

    examVm.init = function (data) {
        examVm.published =  data.published;
        examVm.id =  data.id;
        examVm.title =  data.title;
        examVm.code =  data.code;
        examVm.cost =  parseInt(data.cost);
        examVm.password =  data.password;
        examVm.image = data.image;
        examVm.description = data.description;
        examVm.tags = data.tags;
        examVm.start = data.start;
        examVm.end = data.end;
        examVm.isEnd = data.isEnd;
        examVm.time_whole_exam = data.time_whole_exam;
        examVm.duration = data.duration;
        examVm.do_to_end_time = data.do_to_end_time;
        examVm.printCost = data.printCost;

        examVm.timeMethodOptions = [
            {id: '0', name: 'Thời gian mỗi câu hỏi'},
            {id: '1', name: 'Thời gian toàn bài'}
        ];

        if (examVm.time_whole_exam) {
            examVm.selectedTimeMethod = {id: '1', name: 'Thời gian toàn bài'};
            examVm.duration = examVm.duration / 60;
        } else {
            examVm.selectedTimeMethod = {id: '0', name: 'Thời gian mỗi câu hỏi'};
        }

        examVm.settings = data;
        examVm.settings.playerList = (data.permitted_players && data.permitted_players.length > 0) ? angular.fromJson(data.permitted_players) : [];
        examVm.identifyHelp();

        //use timeout because exam page need to finish display before call ajax
        $timeout(examVm.loadPrintSettings());
    };

    //user enable/disabled end date, so update end time and do to end time (disable if end time is disabled)
    examVm.removeEnd = function() {
        if (examVm.isEnd == false) {
            examVm.do_to_end_time = false;  //disable do to end time if end time is disabled
            examVm.end = '';    //clear end time
            examVm.updateExam(['do_to_end_time', 'end']);
        } else {
            var now = moment();
            if (examVm.start != '') {
                //create end time is tomorrow is start is not null
                var tomorrow = now.add(1, 'd');
                examVm.end = tomorrow.format();
            } else {
                //or usr now is end time if tomorrow is null
                examVm.end = now.format();
            }
            examVm.updateExam(['end']);
        }
    };

    examVm.updateTimeMethod = function () {
        examVm.time_whole_exam = (examVm.selectedTimeMethod['id'] == '1');
        if (examVm.time_whole_exam) {
            examVm.duration = examVm.duration / 60;
        } else {
            examVm.duration = examVm.duration * 60;
        }
        examVm.updateExam(['time_whole_exam']);
    };

    //post update for exam information use ExamService factory
    examVm.updateExam = function(fields) {
        examVm.statusMessage = 'Đang lưu...';
        //create new exam service ($resource) to send to server
        var exam = new ExamService({id: examVm.id});

        //push data from $scope to resource class object
        var i, field, value, n = fields.length;
        var c = 0;
        for (i=0; i < n; i++) {
            field = fields[i];
            value = examVm[field];
            if (field == 'cost') {
                if (examVm[field] == null) {
                    value = 0;
                } else if (examVm[field] < 0 || examVm[field] > 2000) {
                    //not allow for exam cost greater than 2000 coin
                    continue;
                }
            } else if (angular.isUndefined(examVm[field])) continue;

            if (field == 'duration' && examVm.time_whole_exam) {
                exam[field] = value * 60; //convert to seconds unit
            } else {
                exam[field] = value;
            }
            c++;
        }

        if (c == 0) {
            examVm.statusMessage = '';
            return;
        }

        //call update function of $resource object
        exam.$update(function successCallback(){
            examVm.statusMessage = '';
            //remove data from unsaved list
            var i, field, n = fields.length;
            for (i=0; i < n; i++) {
                field = fields[i];
                if (examVm.unSavedList.hasOwnProperty(field)) {
                    delete examVm.unSavedList[field];
                }
            }
        }, function errorCallback(response){
            if (response.status == 422) {
                examVm.statusMessage = 'Dữ liệu không hợp lệ...';

                $timeout(function(){
                    examVm.statusMessage = '';
                }, 5000);
            } else {
                //store data to unsaved list for resent in future (such as user unload, user click finish button)
                var i, field, n = fields.length;
                for (i=0; i < n; i++) {
                    field = fields[i];
                    examVm.unSavedList[field] = examVm[field];
                }
            }
        });
    };

    examVm.avatarProgress = false;  //progress bar to show uploading image progress
    examVm.progressImageUpload = 0; //progress percent
    //upload image to server by ng-file-upload module
    examVm.upload = function(file) {
        if (file && !file.$error) {
            examVm.progressImageUpload = 0;
            examVm.avatarProgress = true;
            Upload.upload({
                url: '/u/exam/' + examVm.id + '/image',
                data: {image: file, oldImage: examVm.image}
            }).then(function successCallback(resp) {
                examVm.image = resp.data.imagePath;
                examVm.progressImageUpload = 95;
                $timeout(function(){
                    examVm.avatarProgress = false;
                    examVm.progressImageUpload = 100;
                }, 2000);
            }, function errorCallback(resp) {
                examVm.avatarProgress = false;
            }, function progressCallback(evt) {
                examVm.progressImageUpload = parseInt(90.0 * evt.loaded / evt.total);
            });
        }
    };

    //ajax loading: if page is display finish, exam id is exist. So request to server to get exam settings
    // $scope.$watch('examVm.id', function handleChangeExamId(){
    //     if (angular.isDefined(examVm.id)){
    //         //examVm.loadSettings();
    //         examVm.loadPrintSettings();
    //     }
    // });

    //get exam setting for setting modal
    // examVm.loadedSettings = false;
    // examVm.settings = null;
    // examVm.loadSettings = function() {
    //     ExamService.getSettings({id: examVm.id}, function successCallback(response){
    //         console.log(response);
    //         if (response.success) {
    //             examVm.statusMessage = '';
    //             examVm.settings = response.settings;
    //             examVm.settings.id = examVm.id;
    //             examVm.identifyHelp();
    //             examVm.getPlayerList();
    //             examVm.loadedSettings = true;
    //         }
    //     }, function errorCallback(response){
    //         examVm.statusMessage = 'Không lấy được các thiết lập';
    //         examVm.settings = [];
    //         examVm.loadedSettings = false;
    //     });
    // };

    //add help attributes for identify whether help is available
    examVm.identifyHelp = function() {
        examVm.settings.help_reduce_selection = parseInt(examVm.settings.help_reduce_selection); //for input type number
        examVm.settings.enableHelpReduceSelection = (examVm.settings.help_reduce_selection != -1);

        examVm.settings.help_increase_time = parseInt(examVm.settings.help_increase_time); //for input type number
        examVm.settings.enableHelpIncreaseTime = (examVm.settings.help_increase_time != -1);

        examVm.settings.help_answer_later = parseInt(examVm.settings.help_answer_later); //for input type number
        examVm.settings.enableHelpAnswerLater = (examVm.settings.help_answer_later != -1);

        examVm.settings.help_save_time = parseInt(examVm.settings.help_save_time); //for input type number
        examVm.settings.enableHelpSaveTime = (examVm.settings.help_save_time != -1);

        examVm.settings.help_question_again = parseInt(examVm.settings.help_question_again); //for input type number
        examVm.settings.enableHelpQuestionAgain = (examVm.settings.help_question_again != -1);

        examVm.settings.help_exam_again = parseInt(examVm.settings.help_exam_again); //for input type number
        examVm.settings.enableHelpExamAgain = (examVm.settings.help_exam_again != -1);
    };

    //parse player in string
    // examVm.getPlayerList = function() {
    //     examVm.settings.playerList = [];
    //     if (examVm.settings.permitted_players) {
    //         examVm.settings.playerList = examVm.settings.permitted_players.split('|', 300);
    //     }
    // };

    /**
     * Display Setting Popup Window
     */
    examVm.showSettingModal = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'examSettingModal.html',
            controller: 'settingCtrl',
            controllerAs: 'settingVm',
            keyboard: true,
            //openedClass: 'cq-exam-modal',
            size: 'lg',
            resolve: {
                examSettings: function () {
                    return examVm.settings;
                }
            }
        });

        //store new settings if user changed
        modalInstance.result.then(function (newSettings){
            examVm.settings = newSettings;
        });

    };

    //creator try to do exam. Server will be prepare data, client display waiting animation
    //after receive information which tell server prepared data, client redirect to question to trying
    examVm.isTry = false;
    examVm.tryToDoExam = function () {
        //display waiting animation window
        var modalInstance = $uibModal.open({
            animation: false,
            templateUrl: 'tryModal.html',
            controller: 'tryCtrl',
            controllerAs: 'tryVm',
            keyboard: false,
            backdrop  : 'static',
            size: null
        });

        examVm.isTry = true;
        ExamService.tryToDoExam({id: examVm.id}, function successCallback(response) {
            if (examVm.isTry && response.success) {
                $window.location.href = '/u/exam/' + examVm.id + '/run/question/' + response.firstQuestionId
                    + '?order=' + 1 + '&trying=1';
            } else {
                modalInstance.close();
            }
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
        });

        modalInstance.result.then(function (){
            examVm.isTry = false;
        });


    };

    //load print settings in export exam to pdf
    examVm.loadedPrintSettings = false;     //flag to know whether loading is finished
    examVm.printSettings = null;            //object store print settings
    examVm.loadPrintSettings = function() {
        PrintingService.getSettings({id: examVm.id}, function successCallback(response){
            examVm.statusMessage = '';

            if (!angular.isObject(response.printSettings)) {
                //exam printing does not have settings before, so use default settings
                examVm.initPrintSetting();
            } else {
                //load saved printing settings
                examVm.printSettings = response.printSettings;
            }
            examVm.printSettings.cost = examVm.printCost;
            examVm.loadedPrintSettings = true;
        }, function errorCallback(response){
            examVm.statusMessage = 'Không lấy được các thiết lập';
            examVm.printSettings = [];
            examVm.loadedPrintSettings = false;
        });
    };

    //init exam print settings with default values
    examVm.initPrintSetting = function() {
        examVm.printSettings = {};
        examVm.printSettings.exam_id = examVm.id;
        examVm.printSettings.link = '';
        examVm.printSettings.paid = false;
        examVm.printSettings.shuffle_section = true;
        examVm.printSettings.shuffle_question = true;
        examVm.printSettings.shuffle_answer = true;
        examVm.printSettings.question_order = true;
        examVm.printSettings.page_number = true;
        examVm.printSettings.bold_section = true;
        examVm.printSettings.bold_question = true;
        examVm.printSettings.answer_key = false;
        examVm.printSettings.section_break = true;
        examVm.printSettings.question_order_method = 0;
        examVm.printSettings.font_size = 12;
        examVm.printSettings.enable_heading = true;
        examVm.printSettings.heading = '';

    };

    /**
     * display printing setting modal
     */
    examVm.showPrintingModal = function () {
        if (examVm.loadedPrintSettings) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'examPrintingModal.html',
                controller: 'printingCtrl',
                controllerAs: 'printingVm',
                keyboard: false,
                backdrop: 'static',
                //openedClass: 'cq-exam-modal',
                size: 'lg',
                resolve: {
                    printSettings: function () {
                        return examVm.printSettings;
                    }
                }
            });

            modalInstance.result.then(function (printSettings) {
                examVm.printSettings = printSettings;
            });
        } else {
            if (examVm.printSettings === null) {
                examVm.statusMessage = 'Đang lấy các thiết lập...';
            } else {
                examVm.statusMessage = 'Không thể kết nối với máy chủ...';
                examVm.printSettings = null;
            }
        }
    };

    /**
     * change publish status (publish/unpublish)
     */
    examVm.togglePublishing = function () {
        examVm.published = !examVm.published;
        examVm.updateExam(['published']);
    };

    /**
     * Finish exam creation. Resend all requests which send fail before.
     */
    examVm.finish = function () {
        if (angular.isDefined(examVm.id)) {
            if (examVm.unSavedList.length > 0) {
                //resend all fail requests before
                examVm.updateExam(examVm.unSavedList);
            }

            //check whether there are questions with no answer key
            $scope.$broadcast('checkAnswerKey');
        }
    };

    //listen event from detailCtrl child for check answer key
    $scope.$on('afterCheck', function (e, goNext) {
        if (goNext) {
            //display modal window to confirm about finishing exam creation
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'examFinishModal.html',
                controller: 'finishCtrl',
                controllerAs: 'finishVm',
                keyboard: false,
                openedClass: 'cq-exam-modal',
                size: null,
                resolve: {
                    examInfo: function () {
                        return {examId: examVm.id, code: examVm.code, tags: examVm.tags, published: examVm.published};
                    }
                }
            });

            //store publish status if changed
            modalInstance.result.then(function (published) {
                examVm.published = published;
            });
        }
    });

}]);
mainApp.controller('finishCtrl', ['$scope', '$timeout', '$window', 'ngClipboard', 'ExamService', '$uibModalInstance', 'examInfo', function($scope, $timeout, $window, ngClipboard, ExamService, $uibModalInstance,  examInfo){
    //modal to confirm finish creating exam by user
    var finishVm = this; //view's model for detail controller
    finishVm.examInfo = examInfo;
    finishVm.statusMessage = '';
    finishVm.waiting = false;   //waiting for unlock exam
    finishVm.link = 'https://toithi.com/exam/' + examInfo.examId + '/information';

    /**
     * Unlock exam if user lock exam in original page
     */
    finishVm.unlockExam = function() {
        if (finishVm.examInfo.published) return;

        finishVm.statusMessage = 'Đang mở khóa...';
        var exam = new ExamService({id: finishVm.examInfo.examId});
        exam['published'] = true;

        finishVm.waiting = true;
        exam.$update(function successCallback(){
            finishVm.statusMessage = '';
            finishVm.waiting = false;
            finishVm.examInfo.published = true;
        }, function errorCallback(response){
            finishVm.waiting = false;
            if (response.status == 422) {
                finishVm.statusMessage = 'Dữ liệu không hợp lệ...';
                $timeout(function(){
                    finishVm.statusMessage = '';
                }, 5000);
            } else {
                finishVm.statusMessage = 'Không kết nối với server được...';
            }
        });
    };

    finishVm.copyLink = function () {
        ngClipboard.toClipboard(finishVm.link);
        finishVm.statusMessage = 'Liên kết đã sao chép vào clipboard';
        $timeout(function(){
            finishVm.statusMessage = '';
        }, 5000);
    };

    finishVm.close = function () {
        $uibModalInstance.close(finishVm.examInfo.published);
    };

    finishVm.end = function () {
        finishVm.waiting = true;
        $window.location.href = '/';
    };
}]);
mainApp.controller('printingCtrl', ['$scope', '$timeout', 'PrintingService', '$uibModalInstance', 'printSettings', 'Upload', function($scope, $timeout, PrintingService, $uibModalInstance, printSettings, Upload){
    //modal to print exam
    var printingVm = this; //view's model for detail controller
    printingVm.settings = printSettings;
    printingVm.statusMessage = '';

    //display old printing link if user want to download old exam.
    if (printingVm.settings.link == '') {
        printingVm.downloadLink = '';
    } else {
        printingVm.downloadLink = 'Bản in đã tạo lần trước: <a href="' + printingVm.settings.link + '" target="_blank">'
            + printingVm.settings.link + '</a>';
    }

    /**
     * do printing payment
     */
    printingVm.payForPrint = function() {
        var printing = new PrintingService({id: printingVm.settings.exam_id});

        printingVm.statusMessage = 'Đang thanh toán...';

        printing.$pay(function successCallback(response){
            printingVm.statusMessage = '';
            if (response.success) {
                printingVm.settings.paid = true;
            } else {
                printingVm.statusMessage = response.message;
            }
        }, function errorCallback(response){
            printingVm.statusMessage = 'Giao dịch không thành công...';
        });
    };

    /**
     * Update printing settings
     * @param field
     * @param value
     */
    printingVm.update = function(field, value) {
        if (!printingVm.settings.paid) return;

        var printing = new PrintingService({id: printingVm.settings.exam_id});
        printing[field] = value;

        if (field == 'enable_heading') {
            printing['heading'] = printingVm.settings.heading;
        }

        printingVm.statusMessage = 'Đang lưu...';
        //call update function of $resource object
        printing.$update(function successCallback(){
            printingVm.statusMessage = '';
        }, function errorCallback(response){
            if (response.status == 422) {
                printingVm.statusMessage = 'Dữ liệu không hợp lệ...';

                $timeout(function(){
                    printingVm.statusMessage = '';
                }, 5000);
            } else {
                printingVm.statusMessage = 'Không lưu được...';
            }
        });
    };

    /**
     * set print heading
     */
    printingVm.setDefaultHeading = function() {
        printingVm.settings.heading = printingVm.templateHeading;
        printingVm.update('heading', printingVm.settings.heading);
    };

    //print to pdf
    printingVm.exporting = false;
    printingVm.print = function() {
        //print to pdf
        //This method is work, but it is just download by browser's downloader
        //PrintingService.printPDF({id: printingVm.examId}, function successCallback(data){
        //    console.log(data);
        //    var blob = data.response.blob;
        //    var fileName = data.response.fileName || 'printing.pdf';
        //
        //    //Use FileSaver.js to download blob file
        //    saveAs(blob, fileName);
        //
        //    //var fileURL = URL.createObjectURL(response);
        //    //window.open(fileURL);
        //
        //}, function errorCallback(response){
        //    console.log("error");
        //    console.log(response);
        //});

        //get link pdf
        printingVm.exporting = true;
        printingVm.downloadLink = 'Vui lòng chờ trong ít phút... Thời gian phụ thuộc vào độ dài của nội dung.';

        var printing = new PrintingService({id: printingVm.settings.exam_id});

        //call update function of $resource object
        printing.$exportPdf(function successCallback(response){
            console.log(response);
            printingVm.exporting = false;
            if (response.success) {
                printingVm.settings.link = response.link;
                printingVm.downloadLink = 'Link tải bản in: <a href="' + response.link + '" target="_blank">'
                    + response.link + '</a>';
            } else {
                printingVm.downloadLink = 'Bạn đã tạo bản in vượt số lượng cho phép một ngày. Vui lòng quay lại vào ngày khác';
            }
        }, function errorCallback(response){
            console.log("error");
            console.log(response);
            printingVm.downloadLink = 'Không tạo được bản in. Nguyên nhân có thể do lỗi server hoặc đề quá dài, có nhiều hình ảnh và video.';
            printingVm.statusMessage = 'Không kết nối với server được.';
            $timeout(function(){
                printingVm.statusMessage = '';
            }, 5000);

            printingVm.downloadLink = '';
            printingVm.exporting = false;
        });


    };

    //close modal
    printingVm.close = function () {
        $uibModalInstance.close(printingVm.settings);
    };

    //custom printing header in tinymce editor
    var customToolbar = "fontselect | fontsizeselect | forecolor backcolor |" +
        " alignleft aligncenter alignright alignjustify |" +
        " bullist numlist indent outdent | image | fullscreen | code";
    printingVm.editorSettings = {
        language_url : '/js/tinymce-v451/langs/vi.js',
        external_plugins: {
            'advlist': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/advlist/plugin.min.js',
            'link': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/link/plugin.min.js',
            'image': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/image/plugin.min.js',
            'imagetools': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/imagetools/plugin.min.js',
            'lists': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/lists/plugin.min.js',
            'charmap': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/charmap/plugin.min.js',
            'hr': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/hr/plugin.min.js',
            'table': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/table/plugin.min.js',
            'contextmenu': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/contextmenu/plugin.min.js',
            'paste': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/paste/plugin.min.js',
            'textcolor': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/textcolor/plugin.min.js',
            'colorpicker': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/colorpicker/plugin.min.js',
            'fullscreen': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/fullscreen/plugin.min.js',
            'code': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/code/plugin.min.js'
        },
        trusted: true, // all TinyMCE content that is set to ngModel will be whitelisted by $sce
        theme: "modern",
        language: 'vi',
        plugins: [
            "advlist link image imagetools lists charmap hr",
            "table contextmenu paste textcolor colorpicker fullscreen code"
        ], //don't use code plugin, because MathJax script will modified
        contextmenu: "cut copy paste | link image inserttable | cell row column deletetable",
        menu: {
            edit: {title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall'},
            insert: {title: 'Insert', items: 'image link | charmap hr template'},
            format: {title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat'},
            table: {title: 'Table', items: 'inserttable tableprops deletetable | cell row column'},
            tools: {title: 'Tools', items: 'code'}
        },
        menubar: "edit insert format table tools",
        toolbar: customToolbar,
        table_default_styles: {
            width: '100%'
        },
        statusbar: false,
        fontsize_formats: '8pt 10pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 32pt 36pt 48pt 72pt',
        custom_undo_redo_levels: 5,
        relative_urls: false,
        remove_script_host: false,
        convert_urls : true,
        //paste_retain_style_properties: "color font-weight text-align text-decoration border background float display",
        content_css: ["/css/bootstrap.min.css?" + new Date().getTime()], //add some attribute
        height: 260,
        file_picker_callback: function (callback, value, meta){
            if (meta.filetype == 'image') {
                tinymce.activeEditor.windowManager.open({
                    title: 'Đăng Tải Hình',
                    url: '/u/image/exam/' + printingVm.settings.exam_id,
                    width: 650,
                    height: 470
                }, {
                    oninsert: function (url) {
                        callback(url);
                        //detailVm.initTinyMceWithNoChange = false; //user interacted with editor. if user init tinymce and add new image, it must be saved.
                    }
                });
            }
        },
        file_picker_types: 'image',
        images_upload_handler: function(blobInfo, success, failure) {
            var file = new File([blobInfo.blob()], blobInfo.filename());

            //resize and convert image before upload to server
            Upload.imageDimensions(file).then(function(dimensions){
                if (dimensions.width > 1920 || dimensions.height > 1200) {
                    Upload.resize(file, 1920, 1200, .8, 'image/jpeg').then(function(resizedFile){
                        file = resizedFile;
                    });
                }
            });

            //upload image to server
            Upload.upload({
                url: '/u/image/exam/' + printingVm.settings.exam_id,
                data: {image: file}
            }).then(function successCallback(response) {
                var imageUrl = '/image/' + response.data.imageName;
                success(imageUrl);
            }, function errorCallback(resp) {
                failure('Update image failure');
            }, function progressCallback(evt) {
                //imageVm.progressImageUpload = parseInt(90.0 * evt.loaded / evt.total);
            });
        },
        setup: function(editor) {
            editor.on('KeyDown', function(e) {
                editor.isSavedContent = false;

                editor.moveNext = (e.key == "ArrowRight" || e.key == "Right"); //move next. Otherwise, move previous
                editor.endInlineMath = (e.key == ')'); //add zwnj; after ) for inline math on change event
                editor.runMathJax = (e.key == ']') || (e.key == '$'); //process Mathjax when key press is ] or $. For ), use endInlineMath

                //check length limit
                var control_keys = ['Backspace', 'Enter', 'Shift', 'Control', 'Alt', 'CapsLock', 'PageUp', 'PageDown',
                    'End', 'Home', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Delete', 'Left', 'Up', 'Right', 'Down', 'Del'];
                if(control_keys.indexOf(e.key) == -1){
                    var chars_with_html = editor.getContent().length;

                    //limit of heading is about 2000 chars in UTF-8
                    if (chars_with_html > 2000) {
                        printingVm.statusMessage = 'Chiều dài vượt giới hạn!';
                        editor.stopPropagation();
                        editor.preventDefault();
                        return false;
                    }
                }
            });

            editor.on('blur', function(){
                printingVm.update('heading', editor.getContent());
            });
        }
    };

    //template print heading
    printingVm.templateHeading = [
        '<table style="width: 100%; border-style: none;">',
            '<tbody>',
                '<tr>',
                    '<td style="vertical-align: top;">',
                        '<p style="text-align: center;">',
                            '<strong>BỘ GIÁO DỤC & ĐÀO TẠO<br></strong>',
                            '<strong>TRƯỜNG ĐẠI HỌC ...<br></strong>',
                            '<strong>KHOA ...<br></strong>',
                            '<hr style="width: 50%; border-top: 1px solid black;">',
                        '</p>',
                    '</td>',
                    '<td style="vertical-align: top;">',
                        '<p style="text-align: center;">',
                            '<strong>ĐỀ THI HỌC KỲ I<br></strong>',
                            '<strong>Môn học: ...<br></strong>',
                            '<em>Thời gian: 90 phút<br></em>',
                            '<em>(Không được tham khảo tài liệu)</em>',
                        '</p>',
                    '</td>',
                '</tr>',
            '</tbody>',
        '</table>',
        '<table style="width: 100%; border-style: none;">',
            '<tbody>',
                '<tr>',
                    '<td style="width: 90.3236%;">',
                        '<p>&nbsp; Họ tên: .....................................................................................</p>',
                        '<p>&nbsp; Mã sinh viên: ...........................................................................</p>',
                        '<p>&nbsp; Lớp:..........................................................................................</p>',
                    '</td>',
                    '<td style="width: 10%;">',
                        '<table style="width: 114px; border-style: solid; height: 29px; border-color: #000000;">',
                            '<tbody>',
                                '<tr>',
                                    '<td style="text-align: center; width: 113px;">Mã đề 001</td>',
                                '</tr>',
                            '</tbody>',
                        '</table>',
                    '</td>',
                '</tr>',
            '</tbody>',
        '</table>'
    ].join('\n');

    //if user not set printing heading, we will use template heading
    if (printingVm.settings.heading == null || printingVm.settings.heading.length == 0) {
        //must check after loading printingVm.templateHeading
        printingVm.settings.heading = printingVm.templateHeading;
    }
}]);
mainApp.controller('settingCtrl', ['$scope', '$timeout', 'ExamService', '$uibModalInstance', 'examSettings', 'Upload', function($scope, $timeout, ExamService, $uibModalInstance, examSettings, Upload){
    //examCreationCtrl Controller is parent
    //This use following variables:
    //  - id (exam id)

    var settingVm = this; //view's model for detail controller

    settingVm.examSettings = examSettings;
    console.log(settingVm.examSettings);

    settingVm.selectedDisplayMethod = (settingVm.examSettings.display_all_question) ? '1' : '0';

    /**
     * update help settings
     * @param field
     * @param isEnable
     */
    settingVm.updateHelpEnable = function(field, isEnable) {
        //if help field is -1, it is disable. Otherwise, it have cost which is 1 or user defined.
        var value = (isEnable == 1) ? 1 : -1;
        settingVm.examSettings[field] = value;
        settingVm.update(field, value); //reset value when toggle help
    };

    settingVm.statusMessage = '';
    /**
     * Send data settings to update on server
     * @param field
     * @param value
     */
    settingVm.update = function(field, value) {

        if (field == 'help_exam_again' || field == 'help_question_again' || field == 'help_save_time'
            || field == 'help_answer_later'|| field == 'help_increase_time'|| field == 'help_reduce_selection') {
            if (value < -1 || value > 1000) { //-1 for disable help
                return;
            }
        }

        if (field == 'max_exam_again' || field == 'max_question_again' || field == 'max_save_time'
            || field == 'max_answer_later'|| field == 'max_increase_time'|| field == 'max_reduce_selection') {
            if (value < 1 || value > 1000) {
                return;
            }
        }

        //create new exam service ($resource) to send to server
        var examService = new ExamService({id: settingVm.examSettings.id});
        examService[field] = value;

        settingVm.statusMessage = 'Đang lưu...';
        //call update function of $resource object
        examService.$update(function successCallback(){

            settingVm.statusMessage = '';
        }, function errorCallback(response){
            if (response.status == 422) {
                settingVm.statusMessage = 'Dữ liệu không hợp lệ...';

                $timeout(function(){
                    settingVm.statusMessage = '';
                }, 5000);
            } else {
                settingVm.statusMessage = 'Không lưu được...';
            }
        });
    };

    /**
     * upload player list who allowed to access
     * @param file
     */
    settingVm.uploadPlayerList = function(file) {
        if (file && !file.$error) {
            settingVm.statusMessage = 'Đang tải dữ liệu lên...';
            Upload.upload({
                url: '/u/exam/' + settingVm.examSettings.id + '/upload-players',
                data: {players: file}
            }).then(function successCallback(response) {
                //settingVm.examSettings.permitted_players = resp.data.players;
                if (response.data.success) {
                    if (response.data.players && response.data.players.length > 0) {
                        settingVm.examSettings.playerList = angular.fromJson(response.data.players);
                    }
                    else settingVm.examSettings.playerList = [];
                }

                // settingVm.examSettings.playerList = [];
                // if (settingVm.examSettings.permitted_players != '') {
                //     settingVm.examSettings.playerList = settingVm.examSettings.permitted_players.split('|');
                // }
                settingVm.statusMessage = '';
            }, function errorCallback(resp) {
                settingVm.statusMessage = 'Dữ liệu không tải lên được...';
                $timeout(function(){
                    settingVm.statusMessage = '';
                }, 5000);
            });
        } else {
            settingVm.statusMessage = 'File không hợp lệ...';
            $timeout(function(){
                settingVm.statusMessage = '';
            }, 5000);
        }

    };

    /**
     * Close modal
     */
    settingVm.close = function () {
        $uibModalInstance.close(settingVm.examSettings);
    };

}]);

mainApp.controller('tryCtrl', ['$scope', '$uibModalInstance', function($scope, $uibModalInstance){
    //modal to display waiting for loading try exam
    var tryVm = this; //view's model for detail controller
    tryVm.close = function () {
        $uibModalInstance.close();
    };
}]);
mainApp.controller('certificateCtrl', ['$scope', '$timeout', '$uibModal', 'CertificateService', function($scope, $timeout, $uibModal, CertificateService){
    var certificateVm = this;
    certificateVm.certPaid = false;
    certificateVm.certLink = null;
    certificateVm.certPaidCost = 0;
    certificateVm.coin = 0;
    certificateVm.examId = null;

    certificateVm.init = function(data) {
        console.log(data);
        certificateVm.certPaid = data.certPaid;
        certificateVm.certLink = data.certLink;
        certificateVm.certPaidCost = data.certPaidCost;
        certificateVm.coin = data.coin;
        certificateVm.examId = data.examId;
    };

    certificateVm.print = function () {
        if (certificateVm.certPaid) {
            certificateVm.doPrintCert();
        } else {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'confirmPayCertModal.html',
                controller: 'confirmPayCertCtrl',
                controllerAs: 'confirmPayCertVm',
                keyboard: true,
                resolve: {
                    data: function() {
                        return {
                            coin: certificateVm.coin,
                            certPaidCost: certificateVm.certPaidCost
                        };
                    }
                }
            });

            modalInstance.result.then(function (confirm){
                if (confirm) {
                    certificateVm.doPrintCert();
                }
            })
        }
    };

    certificateVm.message = '';
    certificateVm.printing = false;
    certificateVm.certDate = null;
    certificateVm.doPrintCert = function () {
        if (certificateVm.printing) return;

        certificateVm.printing = true;
        CertificateService.print({id: certificateVm.examId}, function successCallback(response) {
            if (response.success) {
                certificateVm.certLink = response.link;
                certificateVm.certDate = moment().format('DD-MM-YYYY');
            } else {
                certificateVm.message = response.message;
            }
            certificateVm.printing = false;
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            certificateVm.printing = false;
        });
    };

}]);
mainApp.controller('confirmExamAgainCtrl', ['$scope', '$uibModalInstance', function($scope, $uibModalInstance){
    //modal to confirm do exam again by user
    var confirmExamAgainVm = this; //view's model for detail controller

    confirmExamAgainVm.cancel = function () {
        $uibModalInstance.close(false);
    };

    confirmExamAgainVm.finish = function () {
        $uibModalInstance.close(true);
    };

}]);
mainApp.controller('confirmPayCertCtrl', ['$scope', '$uibModalInstance', 'data', function($scope, $uibModalInstance, data){
    var confirmPayCertVm = this;
    confirmPayCertVm.certPaidCost = data.certPaidCost;
    confirmPayCertVm.coin = data.coin;
    confirmPayCertVm.message = (data.coin < data.certPaidCost) ? 'Bạn không đủ xu để thực hiện' : '';

    confirmPayCertVm.cancel = function () {
        $uibModalInstance.close(false);
    };

    confirmPayCertVm.finish = function () {
        if (confirmPayCertVm.coin >= confirmPayCertVm.certPaidCost) {
            $uibModalInstance.close(true);
        }
    };

}]);
mainApp.controller('dashboardCtrl', ['$scope', '$uibModal', '$window', '$timeout', 'DashboardService', 'InformationService', 'RunService', function($scope, $uibModal, $window, $timeout, DashboardService, InformationService, RunService){

    var dashboardVm = this;
    dashboardVm.score = ""; //user score

    dashboardVm.query = ''; //query string on header

    /**
    * search exam on header bar
    */
    dashboardVm.searchExam = function () {
        dashboardVm.query = dashboardVm.query.trim();
        if (dashboardVm.query.length === 0 ) return;

        $window.location.href = '/search?q=' + dashboardVm.query;
    };

    /**
     * init dashboard page wih information from server
     * @param data
     */
    dashboardVm.init = function (data) {
        dashboardVm.userId = data.userId;
        dashboardVm.userIsCreator = data.userIsCreator;
        dashboardVm.examId = data.examId;
        dashboardVm.isExamFinish = data.isExamFinish;

        console.log('isExamFisish');
        console.log(dashboardVm.isExamFinish);

        dashboardVm.userCoin = (data.userCoin * 1).toString();

        //Helps
        dashboardVm.remain_question_again = data.remain_question_again;
        dashboardVm.remain_exam_again = data.remain_exam_again;
        dashboardVm.helpQuestionAgain = data.helpQuestionAgain;
        dashboardVm.isQuestionAgain = (data.helpQuestionAgain >= 0 && dashboardVm.remain_question_again > 0);
        dashboardVm.helpExamAgain = data.helpExamAgain;
        dashboardVm.isExamAgain = (data.helpExamAgain >=0 && dashboardVm.remain_exam_again > 0);

        //user rating and comment
        dashboardVm.starRating = data.votePoint;
        dashboardVm.comment = data.voteComment;

        //display time method and count down if method is suitable
        dashboardVm.timeMethod = data.timeMethod; //0: Time for each question, 1: time for whole exam with specific duration, 2: time for whole exam with open to end time
        if (data.timeMethod == 1) {//time whole exam
            dashboardVm.isBegin = data.isBegin;
            if (!data.isBegin) {
                dashboardVm.remainTime = data.remainTime/60; //minute unit
            } else {
                // dashboardVm.timeZone = data.timeZone;
                // dashboardVm.beginTime = moment.tz(data.beginTime, data.timeZone);
                // dashboardVm.endTime = (data.endTime != null) ? moment.tz(data.endTime, data.timeZone) : null;
                // var durationFromEnd = (dashboardVm.endTime != null) ? dashboardVm.endTime.diff(dashboardVm.beginTime, 'seconds') : null;
                // if (durationFromEnd != null && durationFromEnd < data.duration) {
                //     dashboardVm.duration = durationFromEnd;
                // } else {
                //     dashboardVm.duration = data.duration;
                // }

                dashboardVm.remainTime = data.remainTime;
                if (!dashboardVm.isExamFinish) {
                    dashboardVm.startPoint = moment();
                    dashboardVm.stopCountDown();
                    dashboardVm.myCountDown = $timeout(dashboardVm.runCountDown, 1000);
                }
            }
        } else {
            dashboardVm.isBegin = 0;
            dashboardVm.remainTime = 0;
        }

        //load all question to display cards
        $timeout(dashboardVm.loadQuestionInfo);

        //load leader board except for creator
        if (!dashboardVm.userIsCreator) {
            $timeout(dashboardVm.loadLeaderBoard(), 1000);
        }
    };

    dashboardVm.showDetailProgress = false; //show or not display result progress bar flag
    /**
     * display result detail progress bar (number of correct, number of incorrect questions)
     */
    dashboardVm.toggleDisplayProgress = function() {
        if (dashboardVm.showAnswerKey) {
            dashboardVm.showDetailProgress = !dashboardVm.showDetailProgress;
        }
    };

    dashboardVm.loadedQuestions = false; //load question flag
    dashboardVm.displayedQuestions = []; //questions are displayed on the page
    dashboardVm.questions = []; //all questions are loaded to client
    dashboardVm.loadQuestionInfo = function() {
        DashboardService.loadQuestion({'id': dashboardVm.examId}, function successCallback(response){
            dashboardVm.loadedQuestions = true;

            dashboardVm.questionRate = response.data.nDoneQuestion + "/" + response.data.totalQuestion;
            dashboardVm.nDoneQuestion = response.data.nDoneQuestion;
            dashboardVm.totalQuestion = response.data.totalQuestion;
            dashboardVm.rateDoneQuestion = Math.round((dashboardVm.nDoneQuestion/dashboardVm.totalQuestion)*100);

            dashboardVm.isExamFinish = response.data.isExamFinish;

            dashboardVm.showQuestionAfterFinish = response.data.showQuestionAfterFinish;

            dashboardVm.showAnswerKey = response.data.showAnswerKey;

            //if show anwser key, display number correct/incorrect questions
            if (dashboardVm.showAnswerKey) {
                dashboardVm.nCorrectQuestion = response.data.nCorrectQuestion;
                dashboardVm.rateCorrectQuestion = Math.round((dashboardVm.nCorrectQuestion/dashboardVm.totalQuestion)*100);

                dashboardVm.nIncorrectQuestion = dashboardVm.nDoneQuestion - dashboardVm.nCorrectQuestion;
                dashboardVm.rateInCorrectQuestion = Math.round((dashboardVm.nIncorrectQuestion/dashboardVm.totalQuestion)*100);
            }

            //diplay score when exam is finished or show answer key
            if(dashboardVm.isExamFinish || dashboardVm.showAnswerKey) {
                dashboardVm.showScore = true;
                dashboardVm.score = response.data.score;
            } else {
                dashboardVm.showScore = false;
            }

            //because we display some question not all question, so init with some question on view
            //other question will display when user scroll to.
            dashboardVm.questions = response.data.questions;
            dashboardVm.loadMoreQuestion(); //load some init question when user have not scroll yet.

            //prepare answers, it means attach answer to user_answer table
            if(!response.data.preparedAnswers) {
                //prepare answer before user do
                dashboardVm.prepareAnswers();
            } else {
                dashboardVm.preparedAnswers = true;

                //check exam whether changed by creator after user accessed exam (answers must be prepared before)
                dashboardVm.requireSync = response.data.requireSync;
            }

        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
        });
    };

    dashboardVm.loadedLeaderBoard = false;  //leader board loaded flag
    dashboardVm.leaderBoardRequest = null;  //hold leader board request to cancel when need
    dashboardVm.loadLeaderBoard = function() {
        if (dashboardVm.userIsCreator) return;

        dashboardVm.leaderBoardRequest = DashboardService.loadLeaderBoard({'id': dashboardVm.examId}, function successCallback(response){
            dashboardVm.loadedLeaderBoard = true;
            dashboardVm.topTenStudents = response.data;
            console.log(dashboardVm.topTenStudents);
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
        });
    };

    dashboardVm.loadedAllQuestion = false;  //loaded question flag
    //display more question to view when user scroll to
    dashboardVm.loadMoreQuestion = function() {
        //Infinite scroll in with ngInfiniteScroll
        if (dashboardVm.questions.length == dashboardVm.displayedQuestions.length) {
            dashboardVm.loadedAllQuestion = true;
            return;
        }

        var n = dashboardVm.questions.length;
        if (dashboardVm.questions.length - dashboardVm.displayedQuestions.length > 20) {
            n = dashboardVm.displayedQuestions.length + 20;
        }

        for (var i = dashboardVm.displayedQuestions.length; i < n; i++) {
            dashboardVm.displayedQuestions.push(dashboardVm.questions[i]);
        }
    };

    dashboardVm.loadedStudents = [];    //store loaded students in leader board when user click more students
    dashboardVm.loadedStudentPage = 0;  //page to display student list in leader board
    //display more student ranking
    dashboardVm.showMoreRank = function() {
        if (dashboardVm.userIsCreator) return;

        //if students is not loaded, copy student from toptenStudents list, remove current user
        if (dashboardVm.loadedStudents.length == 0) {
            dashboardVm.loadedStudents = dashboardVm.topTenStudents.slice(); //copy a new, independent array
            dashboardVm.loadedStudentPage = 1;
            if (dashboardVm.loadedStudents.length == 11) {
                dashboardVm.loadedStudents.splice(10, 1); //remove current user because it is not continually
            }
        }

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'leaderBoardModal.html',
            controller: 'leaderBoardCtrl',
            controllerAs: 'leaderBoardVm',
            keyboard: true,
            size: 'lg',
            resolve: {
                data: function() {
                    return {
                        userId: dashboardVm.userId,
                        examId: dashboardVm.examId,
                        students: dashboardVm.loadedStudents,
                        page: dashboardVm.loadedStudentPage,
                        showScore: dashboardVm.showScore
                    };
                }
            }

        });
        modalInstance.result.then(function (result) {
            dashboardVm.loadedStudents = result.students;
            dashboardVm.loadedStudentPage = result.page;
        });
    };

    dashboardVm.preparedAnswers = false;    //prepared answers flag
    dashboardVm.prepareAnswers = function () {
        DashboardService.prepareAnswer({'id': dashboardVm.examId}, function successCallback(response){
            if (response.success) {
                dashboardVm.preparedAnswers = true;
                if (dashboardVm.accessingQuestion != null) {
                    //cancel other request
                    if (dashboardVm.leaderBoardRequest != null) {
                        dashboardVm.leaderBoardRequest.$cancelRequest();
                    }

                    $window.location.href = '/u/exam/' + dashboardVm.examId
                        + '/run/question/' + dashboardVm.accessingQuestion
                        + '?order=' + dashboardVm.accessingOrder;
                }
            }
            dashboardVm.accessButPreparingAnswers = false;
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
        });
    };

    dashboardVm.synchronizingExam = false;
    dashboardVm.requireSync = false;      //flag to infor to user need refresh page to get updated exam
    dashboardVm.synchronized = false;
    //check whether exam is changed by creator after user access exam. If yes, synchronize exam and info to user
    dashboardVm.synchronizeExam = function () {
        dashboardVm.synchronizingExam = true;
        DashboardService.synchronizeExam({'id': dashboardVm.examId}, function successCallback(response){
            dashboardVm.synchronized = response.success;
            dashboardVm.requireSync = !response.success;
            dashboardVm.synchronizingExam = false;
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            dashboardVm.synchronizingExam = false;
        });
    };

    dashboardVm.accessingQuestion = null;   //remember question id which user want to access but must be waiting because answers is preparing
    dashboardVm.accessingOrder = null;      //remember question order ...
    dashboardVm.accessButPreparingAnswers = false; //flag to know whether answer is preparing
    /**
     * if answers have not prepared yet, user must be waiting after finish preparing.
     * For go to question which user want to do, we need remember this question infor for access later
     * @param order
     * @param sectionId
     * @param questionId
     * @param $event
     */
    dashboardVm.doQuestion = function(order, sectionId, questionId, $event) {
        //remember question id and order for access future if exam have not prepared yet.
        dashboardVm.accessingQuestion = questionId;
        dashboardVm.accessingOrder = order;

        //if answers have not prepared yet, stop do this question
        if (!dashboardVm.preparedAnswers) {
            $event.stopPropagation();
            dashboardVm.accessButPreparingAnswers = true;
            return;
        }

        //cancel other request
        if (dashboardVm.leaderBoardRequest != null) {
            dashboardVm.leaderBoardRequest.$cancelRequest();
        }

        //change url to do question
        $window.location.href = '/u/exam/' + dashboardVm.examId + '/run/question/' + questionId + '?order=' + order;
    };

    dashboardVm.statusMessage = '';     //status message
    /**
     * Do question again for done question. User can be charged fee.
     * @param order
     * @param sectionId
     * @param questionId
     * @param $event
     */
    dashboardVm.doQuestionAgain = function(order, sectionId, questionId, $event) {
        //if answer have not prepared yet, not do help question
        if (!dashboardVm.preparedAnswers) {
            $event.stopPropagation();
            dashboardVm.accessButPreparingAnswers = true;
            return;
        }

        //not support question again help
        if (dashboardVm.helpQuestionAgain < 0 || dashboardVm.timeMethod == 1 || dashboardVm.isExamFinish) {
            dashboardVm.statusMessage = 'Chức năng không hỗ trợ';

            $timeout(function(){
                dashboardVm.statusMessage = '';
            }, 5000);
            return;
        }

        //if user coin is not enough, don't do help
        if (dashboardVm.helpQuestionAgain >= 0 && dashboardVm.userCoin <= dashboardVm.helpQuestionAgain) {
            dashboardVm.statusMessage = 'Không đủ xu để thực hiện';

            $timeout(function(){
                dashboardVm.statusMessage = '';
            }, 5000);
            return;
        }

        //request server for do help (check valid and charge fee if any)
        dashboardVm.accessingQuestion = questionId;
        dashboardVm.accessingOrder = order;
        RunService.helpQuestion({examId: dashboardVm.examId, questionId: questionId, type: 5}, function successCallback(response){
            dashboardVm.statusMessage = '';
            if (response.success) {
                if (angular.isDefined(response.coin)) {
                    dashboardVm.userCoin = response.coin;
                }

                //cancel other request
                if (dashboardVm.leaderBoardRequest != null) {
                    dashboardVm.leaderBoardRequest.$cancelRequest();
                }

                $window.location.href = '/u/exam/' + dashboardVm.examId + '/run/question/'
                    + dashboardVm.accessingQuestion
                    + '?order=' + dashboardVm.accessingOrder;
            } else {
                dashboardVm.statusMessage = response.message;

                $timeout(function(){
                    dashboardVm.statusMessage = '';
                }, 5000);
                dashboardVm.accessingQuestion = null;
                dashboardVm.accessingOrder = null;
            }
        }, function errorCallback(response){
            dashboardVm.statusMessage = '';
            dashboardVm.accessingQuestion = null;
            dashboardVm.accessingOrder = null;
            console.log('error');
            console.log(response);
        });
    };

    //<editor-fold desc="count down mode">
    //count down mode use only for time whole exam
    dashboardVm.calculateCountDown = function (remainTime) {
        dashboardVm.currentSecond = remainTime % 60;
        dashboardVm.currentMinute = (Math.floor(remainTime / 60)) % 60;
        dashboardVm.currentHour = (Math.floor(remainTime / 3600));

        if (dashboardVm.currentHour < 100) {
            dashboardVm.digitalTimer = ('0' + dashboardVm.currentHour).slice(-2) + ':' + ('0' + dashboardVm.currentMinute).slice(-2)
                + ':' + ('0' + dashboardVm.currentSecond).slice(-2);
        } else {
            dashboardVm.digitalTimer = '> 99' + ':' + ('0' + dashboardVm.currentMinute).slice(-2)
                + ':' + ('0' + dashboardVm.currentSecond).slice(-2);
        }
    };

    //each run, calculate remain time base on now, begin time and duration
    dashboardVm.myCountDown = null;
    dashboardVm.runCountDown = function () {
        //var now = moment().tz(dashboardVm.timeZone);
        //var beginToNow = now.diff(dashboardVm.beginTime, 'seconds');

        var now = moment();
        var startToNow = now.diff(dashboardVm.startPoint, 'seconds');

        dashboardVm.localRemainTime = dashboardVm.remainTime - startToNow;

        //dashboardVm.remainTime = dashboardVm.duration - beginToNow;

        if (dashboardVm.localRemainTime > 0) {
            dashboardVm.calculateCountDown(dashboardVm.localRemainTime);
            dashboardVm.myCountDown = $timeout(dashboardVm.runCountDown,1000);
        } else {
            dashboardVm.localRemainTime = 0; //make sure is set to 0
            dashboardVm.calculateCountDown(dashboardVm.localRemainTime);
        }
    };

    //stop count down
    dashboardVm.stopCountDown = function () {
        $timeout.cancel(dashboardVm.myCountDown);
        dashboardVm.calculateCountDown(0);
    };
    //</editor-fold>

    //<editor-fold desc="voting exam">
    dashboardVm.rateMessage = '';   //rate message
    dashboardVm.starRating = 0;     //star rating
    dashboardVm.hoverRating = 0;    //star rating when user hover icons
    dashboardVm.comment = '';       //user comment
    dashboardVm.clickStar = function (param) {
        if (dashboardVm.userId != null) {
            var infoService = new InformationService({'id': dashboardVm.examId});
            infoService['vote_point'] = param;

            infoService.$updateVotePoint(function successCallback(response){
                if (response.success == false) {
                    dashboardVm.starRating = 0;
                    dashboardVm.rateMessage = 'Lỗi chứng thực';
                }
            }, function errorCallback(response) {
                dashboardVm.rateMessage = 'Không kết nối được với server';
            });
        }
    };

    dashboardVm.updateComment = function() {
        if (dashboardVm.userId != null) {
            var infoService = new InformationService({'id': dashboardVm.examId});
            infoService['vote_comment'] = dashboardVm.comment;

            infoService.$updateComment(function successCallback(response){
                if (response.success == false) {
                    dashboardVm.commentMessage = 'Lỗi chứng thực';
                }
            }, function errorCallback(response) {
                dashboardVm.commentMessage = 'Không kết nối được với server';
            });
        }
    };

    dashboardVm.mouseHoverStar = function (param) {
        dashboardVm.hoverRating = param;
    };

    dashboardVm.mouseLeaveStar = function (param) {
        dashboardVm.hoverRating = param + '*';
    };

    dashboardVm.goToInformationPage = function () {
        //cancel other request
        if (dashboardVm.leaderBoardRequest != null) {
            dashboardVm.leaderBoardRequest.$cancelRequest();
        }

        $window.location.href = '/exam/' + dashboardVm.examId + '/information';
    };

    dashboardVm.finishingExam = false;
    dashboardVm.finishExam = function () {
        if (dashboardVm.isExamFinish) return;

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'confirmFinishModal.html',
            controller: 'confirmFinishCtrl',
            controllerAs: 'confirmFinishVm',
            keyboard: true,
            size: null
        });

        modalInstance.result.then(function (confirm){
            if (confirm == true) {
                var runService = new RunService({examId : dashboardVm.examId});
                dashboardVm.finishingExam = true;
                runService.$finishExam(function successCallback(response) {
                    console.log(response);
                    dashboardVm.finishingExam = false;
                    if (response.success) {
                        dashboardVm.isExamFinish = true;

                        dashboardVm.showScore = true;
                        dashboardVm.score = response.examResult.score;
                        var nS = dashboardVm.topTenStudents.length;
                        for(var i=0; i < nS; i++) {
                            if (dashboardVm.topTenStudents[i].id == dashboardVm.userId) {
                                dashboardVm.topTenStudents[i].score = dashboardVm.score;
                                break;
                            }
                        }
                    }
                }, function errorCallback(response){
                    dashboardVm.finishingExam = false;
                    console.log('error');
                    console.log(response);
                });
            }
        });
    };

    dashboardVm.doExamAgain = function () {
        if (!dashboardVm.isExamAgain || dashboardVm.userIsCreator || dashboardVm.helpingExam) return;

        if (dashboardVm.userCoin < dashboardVm.helpExamAgain) {
            $timeout(function () {
                dashboardVm.statusMessage = 'Bạn không đủ xu để thực hiện.';
            }, 5000);
            return;
        }

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'confirmExamAgainModal.html',
            controller: 'confirmExamAgainCtrl',
            controllerAs: 'confirmExamAgainVm',
            keyboard: true,
            size: null
        });

        modalInstance.result.then(function (confirm){
            if (confirm == true) {
                dashboardVm.helpingExam = true;
                DashboardService.helpExamAgain({examId : dashboardVm.examId, type: 6}, function successCallback(response) {
                    console.log(response);
                    dashboardVm.helpingExam = false;
                    if (response.success) {
                        //refresh data
                        dashboardVm.userCoin = response.coin;
                        dashboardVm.remain_exam_again = response.remain_exam_again;

                        //display time method and count down if method is suitable
                        if (dashboardVm.timeMethod == 1) { //time whole exam
                            dashboardVm.isBegin = false;
                            dashboardVm.remainTime = response.remainTime/60; //minute unit
                        } else {
                            dashboardVm.isBegin = false;
                            dashboardVm.remainTime = 0;
                        }

                        dashboardVm.questionRate = 0;
                        dashboardVm.nDoneQuestion = 0;
                        dashboardVm.rateDoneQuestion = 0;

                        dashboardVm.isExamFinish = false;
                        dashboardVm.showAnswerKey = false;
                        dashboardVm.nCorrectQuestion = 0;
                        dashboardVm.nIncorrectQuestion = 0;
                        dashboardVm.rateCorrectQuestion = 0;
                        dashboardVm.rateInCorrectQuestion = 0;
                        dashboardVm.showScore = false;
                        dashboardVm.score = 0;

                        //reset question status (is done, is correct)
                        var i,n;
                        n = dashboardVm.displayedQuestions.length;
                        for(i=0; i<n; i++) {
                            dashboardVm.displayedQuestions[i].is_done = false;
                            dashboardVm.displayedQuestions[i].is_correct = false;
                        }

                        n = dashboardVm.questions.length;
                        for(i=0; i<n; i++) {
                            dashboardVm.questions[i].is_done = false;
                            dashboardVm.questions[i].is_correct = false;
                        }

                        //reset leader board
                        n = dashboardVm.topTenStudents.length;
                        for(i=0; i<n; i++) {
                            if (dashboardVm.topTenStudents[i]['id'] == dashboardVm.userId) {
                                dashboardVm.topTenStudents[i]['score'] = 0;
                                break;
                            }
                        }

                    } else {
                        dashboardVm.statusMessage = response.message;
                    }
                }, function errorCallback(response){
                    console.log('error');
                    console.log(response);
                    dashboardVm.helpingExam = false;
                });
            }
        });
    };

    dashboardVm.getCertificate = function () {
        if (!dashboardVm.isExamFinish) return;

        $window.location.href = '/u/exam/' + dashboardVm.examId + '/dashboard/certificate';
    }
}]);
mainApp.controller('leaderBoardCtrl', ['$scope', '$uibModalInstance', 'DashboardService', 'data', function($scope, $uibModalInstance, DashboardService, data){
    var leaderBoardVm = this;
    leaderBoardVm.data = data; //store students, page, userId, examId
    leaderBoardVm.statusMessage = '';

    leaderBoardVm.loading = false;
    leaderBoardVm.loadMoreStudent = function () {
        leaderBoardVm.loading = true;
        DashboardService.loadMoreStudent({id: leaderBoardVm.data.examId, page: leaderBoardVm.data.page + 1}, function successCallback(response){
            leaderBoardVm.loading = false;
            if(response.data) {
                leaderBoardVm.data.page++;
                leaderBoardVm.data.students = leaderBoardVm.data.students.concat(response.data);
            }
        }, function errorCallback(response){
            leaderBoardVm.loading = false;
            leaderBoardVm.statusMessage = 'Lỗi kết nối server';
            console.log('error');
            console.log(response);
        });

    };

    leaderBoardVm.close = function () {
        $uibModalInstance.close({
            'students': leaderBoardVm.data.students,
            'page': leaderBoardVm.data.page
        });
    };
}]);
mainApp.controller('demoCtrl', ['$scope', '$window', '$timeout', '$uibModal', 'Fullscreen', function($scope, $window, $timeout, $uibModal, Fullscreen){
    var demoVm = this;
    demoVm.statusMessage = '';
    demoVm.savedTime = 0;

    //count unfinished requests for waiting awhile when user go to other page (pause, exit,...)
    demoVm.updating = 0;

    //init Mathjax for display in detail panel only output to SVG type (not CHTML because user can drag and drop into equation and modify it)
    MathJax.Hub.Queue(["setRenderer", MathJax.Hub, "SVG"]);

    demoVm.questionList = null;  //list of loaded question

    demoVm.loadingQuestion = true; //flag to know question is loaded finish
    demoVm.finishPage = false;     //flag to know current page is normal page to display question or finish page to display statistic result
    demoVm.disabledReduceSelection = false; //reduce selection is used only one time
    demoVm.disabledQuestionAgain = false; //use for answer later
    //init question page with data from server
    demoVm.init = function (data) {
        console.log(data);

        demoVm.countDownMode = 1;

        //display question
        demoVm.questionList = data['questionList'];
        demoVm.numberQuestion = demoVm.questionList.length;
        demoVm.questionOrder = 1;
        $timeout(demoVm.loadQuestion, 0, true, demoVm.questionOrder);

        demoVm.savedTime = 0;

        demoVm.questionsStatus = data['questionsStatus'];
        $timeout(demoVm.displayPagePagination);

        //init result chart variables
        $timeout(demoVm.initResultChart);
    };

    //<editor-fold desc="load and display question"
    demoVm.reducedAnswers = [];
    /**
     * load and display question data.
     * @param order
     */
    demoVm.loadQuestion = function (order) {
        var question = demoVm.questionList[order-1];
        demoVm.questionId = question.id;
        demoVm.questionFinished = question.finished;
        demoVm.finishPage = false;

        //calculate duration and set question begin time, timer, bonus
        demoVm.timer = parseInt(question.timer);
        demoVm.bonusTime = parseInt(question.bonusTime);
        demoVm.duration = parseInt(question.timer) + parseInt(question.bonusTime);

        //change current question on question status bar
        demoVm.currentOrder = question.order;
        demoVm.displayPagePagination();

        //check question is group type or not
        demoVm.isGroupType = question.isGroupType;
        demoVm.questionType = question.questionType;

        //detail question
        demoVm.numberSelection = question.numberSelection;
        demoVm.sectionDescription = question.sectionDescription;
        demoVm.questionDescription = question.questionDescription;
        demoVm.answers = question.answers;

        //prepare answer with some variables are set such which answer is selected, which answer is match with matching text
        demoVm.prepareAnswer(question.questionType, question.answers);

        demoVm.reducedAnswers = [];

        //finish loading question, so disable animation loading
        demoVm.loadingQuestion = false;
        demoVm.loadingIcon = false;

        //check which help is permitted
        demoVm.disabledReduceSelection = false;
        demoVm.disabledQuestionAgain = false;

        //reset hiding message if any
        demoVm.hidingMessage = '';
        demoVm.hidingQuestion = false;

        //display count down mode
        demoVm.calculateCountDown(0);
        demoVm.stopCountDown(); //stop count down of previous question
        if (!demoVm.questionFinished && !demoVm.examFinished) {
            if (angular.isDefined(demoVm.questionList[order-1].questionBeginTime)) {
                demoVm.questionBeginTime = demoVm.questionList[order-1].questionBeginTime;
            } else {
                demoVm.questionBeginTime = demoVm.questionList[order-1].questionBeginTime = moment();
            }

            demoVm.duration = question.timer;
            demoVm.myCountDown = $timeout(demoVm.runCountDown, 1000);
        }

        //refresh mathjax equation
        $timeout(function(){
            if (demoVm.questionType == 2) {
                //essay type
                angular.element('#uAnswer').focus();
            }

            MathJax.Hub.Queue(['Typeset', MathJax.Hub], function () {
                console.log('run Mathjax');
                demoVm.refreshAfterMathjax();
            });
        });

        //scroll window to top
        $window.scrollTo(0, 0);
    };

    /**
     * set some variables depend question type to know which one is selected or matching
     * @param questionType
     * @param answers
     */
    demoVm.prepareAnswer = function(questionType, answers) {
        var nAnswer = answers.length;
        var i;

        switch (questionType) {
            case 0: //single choice type
                demoVm.selectedRadio = -1;
                for(i=0; i < nAnswer; i++) {
                    if (answers[i].isSelected) {
                        demoVm.selectedRadio = answers[i].id;
                    }
                }
                break;
            case 1: //multiple choice type
                demoVm.selectedCheckbox = {};
                for(i=0; i < nAnswer; i++) {
                    demoVm.selectedCheckbox[answers[i].id] = (answers[i].isSelected);
                }
                break;
            case 2: //essay type
                demoVm.essay = answers[0].essay;
                break;
            case 3: //matching type
                demoVm.matchedPairArray = {};
                for(i=0; i < nAnswer; i++) {
                    demoVm.matchedPairArray[answers[i].order] = answers[i].matchId;
                }
                demoVm.resetSelectedMatch();
                break;
        }
    };

    demoVm.getNameFromNumber = function (num) {
        console.log(num);
        var numeric = (num - 1) % 26;
        var letter = String.fromCharCode(65 + numeric);
        var num2 = Math.floor((num - 1) / 26);
        if (num2 > 0) {
            return demoVm.getNameFromNumber(num2) + letter;
        } else {
            return letter;
        }
    };

    /**
     * redraw matching connect after refresh mathjax equation
     */
    demoVm.refreshAfterMathjax = function () {
        //matching type
        $timeout(function() {
            demoVm.drawConnect();
        });
    };
    //</editor-fold>

    //<editor-fold desc="display pagination">
    demoVm.questionsStatus = null;       //list of question status will be displayed on header bar

    demoVm.pages = {};   //question page status is displaying on header bar
    demoVm.currentOrder = 1; //current question order
    demoVm.pages.previous = false;  //previous button is display or not
    demoVm.pages.next = false;      //next button is display or not
    demoVm.pages.viewFrame = []; //current view frame
    /**
     * display question list pagination
     */
    demoVm.displayPagePagination = function () {
        if (demoVm.questionsStatus == null) return;

        demoVm.identifyNumberItemPerPage();
        var currentPageItem = demoVm.identifyPageItem(demoVm.currentOrder);

        var middle =  demoVm.numberItemPerPage/2;
        //if page index larger than mid, it will be stand on position mid
        var firstPage = (currentPageItem > middle) ? (currentPageItem - middle) : 0;

        //from firstPage...numberItemPerPage
        var n = Math.min(firstPage + demoVm.numberItemPerPage, demoVm.questionsStatus.length);
        var k = Math.max(n - demoVm.numberItemPerPage, 0);
        demoVm.pages.viewFrame = [];
        for (var i = k; i<n; i++) {
            if (angular.isDefined(demoVm.questionsStatus[i])) {
                var page = {};
                page.order = demoVm.questionsStatus[i]['order'];
                page.id = demoVm.questionsStatus[i]['id'];
                page.done = demoVm.questionsStatus[i]['done'];
                demoVm.pages.viewFrame.push(page); //create current view frame
            }
        }

        //add finish button to question status bar if user go to last view frame
        demoVm.addFinishPageToFrame(n);

        //check enable/disable previous/next button
        demoVm.pages.previous = (k > 0);
        demoVm.pages.next = (n < demoVm.questionsStatus.length);
    };

    demoVm.finishOrder = 'Hoàn thành';   //finish button label
    //add finish button to current view frame (last view frame)
    demoVm.addFinishPageToFrame = function (lastItem) {
        //if current view frame is last view, display finish button
        if (lastItem == demoVm.questionsStatus.length) {
            var finishPageItem = {};
            finishPageItem.order = demoVm.finishOrder;
            finishPageItem.id = null;
            finishPageItem.done = false;
            demoVm.pages.viewFrame.push(finishPageItem);
        }
    };

    /**
     * user click previous button to view previous frame
     */
    demoVm.viewPreviousFrame = function () {
        var firstPageItem = demoVm.identifyPageItem(demoVm.pages.viewFrame[0].order);
        if (firstPageItem == 0) return;

        var k = Math.max(firstPageItem - demoVm.numberItemPerPage, 0);
        var n = Math.min(k + demoVm.numberItemPerPage, demoVm.questionsStatus.length);
        demoVm.pages.viewFrame = [];
        for (var i=k; i<n; i++) {
            if (angular.isDefined(demoVm.questionsStatus[i])) {
                var page = {};
                page.order = demoVm.questionsStatus[i]['order'];
                page.id = demoVm.questionsStatus[i]['id'];
                page.done = demoVm.questionsStatus[i]['done'];
                demoVm.pages.viewFrame.push(page);
            }
        }

        //add finish button to question status bar if user go to last view frame
        demoVm.addFinishPageToFrame(n);

        //check enable/disable previous/next button
        demoVm.pages.previous = (k > 0);
        demoVm.pages.next = (n < demoVm.questionsStatus.length);
    };

    /**
     * user click next button to view next frame
     */
    demoVm.viewNextFrame = function () {
        var lastPageItemOrder = demoVm.pages.viewFrame[demoVm.pages.viewFrame.length - 1].order;
        if (lastPageItemOrder == demoVm.finishOrder) return;

        var lastPageItem = demoVm.identifyPageItem(lastPageItemOrder);

        var n = Math.min(lastPageItem + demoVm.numberItemPerPage, demoVm.questionsStatus.length);
        var k = Math.max(n - demoVm.numberItemPerPage, 0);
        demoVm.pages.viewFrame = [];
        for (var i = k; i<n; i++) {
            if (angular.isDefined(demoVm.questionsStatus[i])) {
                var page = {};
                page.order = demoVm.questionsStatus[i]['order'];
                page.id = demoVm.questionsStatus[i]['id'];
                page.done = demoVm.questionsStatus[i]['done'];
            }
            demoVm.pages.viewFrame.push(page);
        }

        //add finish button to question status bar if user go to last view frame
        demoVm.addFinishPageToFrame(n);

        //check enable/disable previous/next button
        demoVm.pages.next = (n < demoVm.questionsStatus.length);
        demoVm.pages.previous = (k > 0);
    };

    demoVm.numberItemPerPage = 0;    //number question status item per page
    //identify number item per page when user change window size
    demoVm.identifyNumberItemPerPage = function () {
        //all magic width in this function is identified by experience (manually)
        var width = demoVm.myWindow.width();
        if(width > 1150) {
            demoVm.numberItemPerPage = 22;
        } else if(width <= 1150 && width > 880) {
            demoVm.numberItemPerPage = 16;
        } else if (width <= 880 && width > 526) {
            demoVm.numberItemPerPage = 8;
        } else if (width <= 526 && width > 350) {
            demoVm.numberItemPerPage = 4;
        } else {
            demoVm.numberItemPerPage = 2;
        }
    };

    //get question index based on its order
    demoVm.identifyPageItem = function (order) {
        if (demoVm.questionsStatus == null) return null;

        var n = demoVm.questionsStatus.length;
        for(var i=0; i < n; i++) {
            if (demoVm.questionsStatus[i].order == order) {
                return i;
            }
        }

    };
    //</editor-fold>

    //<editor-fold desc="update single choice and multiple choice question">
    //user answer for single choice question by click on description
    demoVm.selectRadio = function(id) {
        if (!demoVm.questionFinished && !demoVm.examFinished && demoVm.selectedRadio != id) {
            demoVm.selectedRadio = id;
            demoVm.updateRadio();
        }
    };

    //user answer for single choice question by click on radio button
    demoVm.updateRadio = function() {
        console.log('update radio');
        if (demoVm.questionFinished || demoVm.examFinished) return;

        var n = demoVm.answers.length;
        for(var i=0; i < n; i++) {
            demoVm.answers[i]['isSelected'] = (demoVm.answers[i]['id'] == demoVm.selectedRadio);
        }
    };

    //user answer for multiple choice question by click on description
    demoVm.selectCheckbox = function(id) {
        if (!demoVm.questionFinished && !demoVm.examFinished) {
            demoVm.selectedCheckbox[id] = !demoVm.selectedCheckbox[id];
            demoVm.updateCheckbox();
        }
    };

    //user answer for multiple choice question by click on checkbox button
    demoVm.updateCheckbox = function() {
        console.log('update checkbox');
        if (demoVm.questionFinished || demoVm.examFinished) return;

        var n = demoVm.answers.length;
        var answerId;
        for(var i=0; i < n; i++) {
            answerId = demoVm.answers[i]['id'];
            demoVm.answers[i]['isSelected'] = demoVm.selectedCheckbox[answerId];
        }

    };
    //</editor-fold>

    //<editor-fold desc="count down mode">
    //extract some time value to display on progress bar
    demoVm.calculateCountDown = function (remainTime) {
        demoVm.currentSecond = remainTime % 60;
        demoVm.currentMinute = (Math.floor(remainTime / 60)) % 60;
        demoVm.currentHour = (Math.floor(remainTime / 3600));

        if (demoVm.currentHour < 100) {
            demoVm.digitalTimer = ('0' + demoVm.currentHour).slice(-2) + ':' + ('0' + demoVm.currentMinute).slice(-2)
                + ':' + ('0' + demoVm.currentSecond).slice(-2);
        } else {
            demoVm.digitalTimer = '> 99' + ':' + ('0' + demoVm.currentMinute).slice(-2)
                + ':' + ('0' + demoVm.currentSecond).slice(-2);
        }

        //decrease hour for display by progress bar
        demoVm.currentHour = demoVm.currentHour > 24 ? 24 : demoVm.currentHour;
    };

    demoVm.myCountDown = null;   //timer promise is used for cancel later
    //run count down
    demoVm.runCountDown = function () {
        var now = moment();
        var beginToNow = now.diff(demoVm.questionBeginTime, 'seconds');

        demoVm.remainTime = demoVm.duration - beginToNow;

        if (demoVm.remainTime > 0) {
            if (demoVm.countDownMode != 0) {
                demoVm.calculateCountDown(demoVm.remainTime);
            }
            demoVm.myCountDown = $timeout(demoVm.runCountDown,1000);
        } else {
            demoVm.remainTime = 0; //make sure is set to 0
            demoVm.calculateCountDown(demoVm.remainTime);
            demoVm.closeQuestion();
        }
    };

    //stop count down
    demoVm.stopCountDown = function () {
        $timeout.cancel(demoVm.myCountDown);
    };

    //user click on count down area to change count down display mode
    demoVm.changeCountDownMode = function () {
        switch (demoVm.countDownMode) {
            case 0:
                demoVm.countDownMode = 1; //display count down (full mode): progress and timer
                break;
            case 1:
                demoVm.countDownMode = 2; //display count down with timer
                break;
            case 2:
                demoVm.countDownMode = 3; //display count down with progress
                break;
            default:
                demoVm.countDownMode = 0; //non-display
                break;
        }
    };
    //</editor-fold>

    //<editor-fold desc="close question">
    //close question when user go to other question
    demoVm.closeQuestion = function () {
        if (demoVm.questionFinished || demoVm.examFinished) return;

        demoVm.calculateCountDown(0);
        demoVm.stopCountDown();

        var order = demoVm.questionOrder;
        var questionId = demoVm.questionId;

        if (demoVm.questionType == 3) {
            //draw again with matching type because appear message div on top make line not correct
            $timeout(function() {
                demoVm.drawConnect();
            });
        }

        //closing question
        demoVm.questionFinished = demoVm.questionList[order-1].finished = true;
        demoVm.questionList[order-1].consumedTime = moment().diff(demoVm.questionBeginTime, 'seconds');

        if (demoVm.questionType == 2) {
            //use essay pseudo input to force tinymce blur for updating content
            var essayPseudo = angular.element(document.querySelector('#essay-pseudo'));
            essayPseudo.focus();
            $timeout(function() {
                demoVm.closeQuestionService(order, questionId);
            });
        } else {
            demoVm.closeQuestionService(order, questionId);
        }
    };

    //service to close question
    demoVm.closeQuestionService = function (order, questionId) {
        if (angular.isUndefined(demoVm.questionList[order - 1])) return;

        demoVm.questionList[order - 1].finished = true;

        //set question status to done
        var currentPageItem = demoVm.identifyPageItem(order);
        demoVm.questionsStatus[currentPageItem].done = true;

        var i, nAnswer, answers;
        nAnswer =  demoVm.questionList[order - 1].answers.length;
        answers = demoVm.questionList[order - 1].answers;
        switch (demoVm.questionList[order - 1].questionType) {
            case 0: //single choice
            case 1: //multiple choice
                for(i=0; i < nAnswer; i++) {
                    demoVm.questionList[order - 1].answers[i]['isRight'] = (answers[i]['isSelected'] == answers[i]['isCorrect']);
                }
                break;
            case 2: //essay
                console.log(answers[0].description.toLowerCase());
                console.log(demoVm.essay.toLowerCase());
                demoVm.questionList[order - 1].answers[0].isRight = (answers[0].description.toLowerCase() == demoVm.essay.toLowerCase());
                break;
            case 3: //matching
                var o;
                for(i=0; i < nAnswer; i++) {
                    o = demoVm.questionList[order - 1].answers[i]['id'] % 10;
                    demoVm.questionList[order - 1].answers[i].isRight = (answers[i]['correctId'] == answers[i]['matchId']);
                }
                $timeout(function() {
                    demoVm.drawConnect();
                });
                break;
        }
    };
    //</editor-fold>

    //<editor-fold desc="change window size">
    demoVm.isFullScreen = false;     //flag to know fullscreen or not
    //toggle display fullscreen
    demoVm.goFullScreen = function () {
        if (Fullscreen.isEnabled()) {
            Fullscreen.cancel();
            demoVm.isFullScreen = false;
        }
        else {
            Fullscreen.all();
            demoVm.isFullScreen = true;
        }
    };

    //detect window size change and update question list and draw matching link
    demoVm.myWindow = angular.element($window);  //get current window element
    //callback function when window is changed size
    demoVm.myWindow.on('resize', function() {
        demoVm.displayPagePagination();

        $timeout(function() {
            demoVm.drawConnect(); //redraw all connect of answer match
        });

        // don't forget manually trigger $digest()
        $scope.$digest();
    });
    //</editor-fold>

    //<editor-fold desc="essay answer">
    demoVm.essay = '';
    demoVm.changeEssay = function (essay) {
        demoVm.questionList[demoVm.questionOrder - 1].answers[0].essay = essay;
    };

    //</editor-fold>

    //<editor-fold desc="matching answer">
    //reset selection in matching type question
    demoVm.resetSelectedMatch = function () {
        demoVm.selectedAnswer = -1;
        demoVm.selectedMatch = -1;
    };

    //select answer box
    demoVm.selectAnswer = function(order, $event) {
        console.log('select answer');
        //matching type
        if (!demoVm.questionFinished && !demoVm.examFinished) {
            demoVm.selectedAnswer = order;
            if ($event != null) $event.stopPropagation();

            if (demoVm.processedMatchedPair) {
                //click new one after paring
                demoVm.selectedMatch = -1;
                demoVm.processedMatchedPair = false;
            } else {
                demoVm.paringMatch();
            }
        }
    };

    //select match box
    demoVm.selectMatch = function(id, $event) {
        console.log('select match');
        //matching type
        if (!demoVm.questionFinished && !demoVm.examFinished) {
            demoVm.selectedMatch = id;
            if ($event != null) $event.stopPropagation();

            if (demoVm.processedMatchedPair) {
                //click new one after paring
                demoVm.selectedAnswer = -1;
                demoVm.processedMatchedPair = false;
            } else {
                demoVm.paringMatch();
            }
        }
    };

    demoVm.processedMatchedPair = false; //flag to know current pair is processed or not
    //do paring
    demoVm.paringMatch = function () {
        if (demoVm.selectedAnswer != -1 &&  demoVm.selectedMatch != -1) {
            //unlink old pair
            for(var order in demoVm.matchedPairArray) {
                // skip loop if the property is from prototype
                if (!demoVm.matchedPairArray.hasOwnProperty(order)) continue;

                if (demoVm.matchedPairArray[order] == demoVm.selectedMatch) {
                    demoVm.matchedPairArray[order] = 0;
                }
            }
            demoVm.matchedPairArray[demoVm.selectedAnswer] = demoVm.selectedMatch;
            demoVm.answers[demoVm.selectedAnswer - 1].matchId = demoVm.selectedMatch; //save to loaded question list for display again if user go back this question
            demoVm.processedMatchedPair = true;
            $timeout(function() {
                demoVm.drawConnect();
            });
        }
    };

    //draw connect for paired matching
    demoVm.drawConnect = function() {
        if (demoVm.finishPage) return;

        if (demoVm.questionType != 3) return;    //not draw for other question type

        var matchId, answerElm, matchElm, line1Elm, line2Elm, line3Elm, beginX, beginY, endX, endY;
        for(var order in demoVm.matchedPairArray) {
            // skip loop if the property is from prototype
            if (!demoVm.matchedPairArray.hasOwnProperty(order)) continue;

            matchId = demoVm.matchedPairArray[order];

            //get answer box element and line element
            answerElm = angular.element(document.querySelector( '#answer-' + order));
            line1Elm = angular.element(document.querySelector( '#line1-' + order));
            line2Elm = angular.element(document.querySelector( '#line2-' + order));
            line3Elm = angular.element(document.querySelector( '#line3-' + order));

            if (matchId != 0) {
                //get match box element
                matchElm = angular.element(document.querySelector( '#match-' + matchId));

                //calculate the coordinates
                beginX = answerElm.position().left + answerElm.outerWidth();
                beginY = answerElm.position().top + answerElm.outerHeight()/2;

                endX = matchElm.position().left;
                endY = matchElm.position().top + matchElm.outerHeight()/2;

                //draw
                line1Elm.attr('x1', beginX); line1Elm.attr('y1', beginY);
                line1Elm.attr('x2', beginX + 10); line1Elm.attr('y2', beginY);

                line2Elm.attr('x1', beginX + 10); line2Elm.attr('y1', beginY);
                line2Elm.attr('x2', endX - 10); line2Elm.attr('y2', endY);

                line3Elm.attr('x1', endX - 10); line3Elm.attr('y1', endY);
                line3Elm.attr('x2', endX); line3Elm.attr('y2', endY);
            } else {
                //clear link if have
                line1Elm.attr('x1', 0); line1Elm.attr('y1', 0); line1Elm.attr('x2', 0); line1Elm.attr('y2', 0);
                line2Elm.attr('x1',0); line2Elm.attr('y1', 0); line2Elm.attr('x2', 0); line2Elm.attr('y2', 0);
                line3Elm.attr('x1', 0); line3Elm.attr('y1', 0); line3Elm.attr('x2', 0); line3Elm.attr('y2', 0);
            }
        }

        //draw line which is answer key (correct line)
        if (demoVm.questionFinished || demoVm.examFinished) {
            var n = demoVm.answers.length;
            for(var i=0; i < n; i++) {
                var answer = demoVm.answers[i];
                if (!answer.isRight) {
                    answerElm = angular.element(document.querySelector( '#answer-' + answer.order));
                    matchElm = angular.element(document.querySelector( '#match-' + answer.correctId));

                    line1Elm = angular.element(document.querySelector( '#line1c-' + answer.order));
                    line2Elm = angular.element(document.querySelector( '#line2c-' + answer.order));
                    line3Elm = angular.element(document.querySelector( '#line3c-' + answer.order));

                    beginX = answerElm.position().left + answerElm.outerWidth();
                    beginY = answerElm.position().top + answerElm.outerHeight()/2 + 5;

                    endX = matchElm.position().left;
                    endY = matchElm.position().top + matchElm.outerHeight()/2 + 5;

                    line1Elm.attr('x1', beginX);
                    line1Elm.attr('y1', beginY);
                    line1Elm.attr('x2', beginX + 10);
                    line1Elm.attr('y2', beginY);

                    line2Elm.attr('x1', beginX + 10);
                    line2Elm.attr('y1', beginY);
                    line2Elm.attr('x2', endX - 10);
                    line2Elm.attr('y2', endY);

                    line3Elm.attr('x1', endX - 10);
                    line3Elm.attr('y1', endY);
                    line3Elm.attr('x2', endX);
                    line3Elm.attr('y2', endY);
                }
            }
        }
    };
    //</editor-fold>

    //<editor-fold desc="Doing help">
    demoVm.doingHelp = false;    //flag to know help is doing
    demoVm.hidingQuestion = false;   //flag to enable/disable hiding question for doing help
    demoVm.helpingType = -1; //helping type
    demoVm.doHelp = function (helpType) {
        if (demoVm.loadingQuestion || demoVm.closing) return;

        demoVm.hidingQuestion = false;
        demoVm.doingHelp = true;
        //process result depend on help type
        switch (helpType) {
            case 0: //reduce selection
                if (demoVm.questionFinished || demoVm.examFinished ||demoVm.disabledReduceSelection) return;

                demoVm.disabledReduceSelection = true;
                var question = demoVm.questionList[demoVm.questionOrder - 1];
                var nReduceAnswers = (question.answers.length/2 >= question.numberSelection) ? question.answers.length/2 : (question.answers.length - question.numberSelection);
                nReduceAnswers = Math.floor(nReduceAnswers);
                var reducedAnswers;
                var i,j;
                switch (question.questionType) {
                    case 0: //single choice
                    case 1: //multiple choice
                        reducedAnswers = [];
                        j = 0;
                        for(i = 0; i < question.answers.length; i++) {
                            if (j < nReduceAnswers && question.answers[i].isCorrect == false) {
                                reducedAnswers.push(question.answers[i].id);
                                j++;
                            }
                        }
                        break;
                    case 2:
                        reducedAnswers = null;
                        break;
                    case 3: //matching type
                        reducedAnswers = {};
                        nReduceAnswers = Math.floor(question.answers.length/2);
                        for(i = 0; i < nReduceAnswers; i++) {
                            reducedAnswers[i+1] = question.answers[i]['correctId'];
                            demoVm.questionList[demoVm.questionOrder - 1].answers[i]['matchId'] = question.answers[i]['correctId'];
                        }
                        console.log(reducedAnswers);
                        break;
                }
                demoVm.helpReduceSelection(reducedAnswers);
                break;
            case 1: //increase time
                if (demoVm.questionFinished || demoVm.examFinished) return;

                demoVm.questionList[demoVm.questionOrder - 1].bonusTime += demoVm.questionList[demoVm.questionOrder - 1].timer;
                demoVm.duration = parseInt(demoVm.questionList[demoVm.questionOrder - 1].timer) + parseInt(demoVm.questionList[demoVm.questionOrder - 1].bonusTime);
                demoVm.questionList[demoVm.questionOrder - 1].finished = false;
                demoVm.questionFinished = false;
                demoVm.stopCountDown(); //for the case, client is time out (user use helps  near end) but server check ok
                demoVm.myCountDown = $timeout(demoVm.runCountDown, 1000);
                break;
            case 2: //answer later
                if (demoVm.questionFinished || demoVm.examFinished) return;

                demoVm.questionFinished = true;
                demoVm.questionList[demoVm.questionOrder - 1].finished = false;
                var usedTime = moment().diff(demoVm.questionBeginTime, 'seconds');
                demoVm.questionList[demoVm.questionOrder - 1].bonusTime = -1 * (usedTime >= demoVm.questionList[demoVm.questionOrder - 1].timer ? 0 : usedTime);
                demoVm.calculateCountDown(0);
                demoVm.stopCountDown();
                demoVm.disabledQuestionAgain = true; //make sure user can not choose question again
                demoVm.hidingMessage = 'Đã tạm hoãn câu hỏi hiện tại. Hãy chọn câu hỏi khác để thực hiện tiếp!';
                demoVm.hidingQuestion = true;
                demoVm.hideQuestionContent();
                delete demoVm.questionList[demoVm.questionOrder - 1].questionBeginTime;
                break;
            case 3: //save time
                if (demoVm.questionFinished || demoVm.examFinished) return;

                demoVm.questionFinished = true;
                demoVm.questionList[demoVm.questionOrder-1].finished = true;
                demoVm.questionList[demoVm.questionOrder-1].bonusTime = 0;
                if (demoVm.questionsStatus != null) {
                    var currentPageItem = demoVm.identifyPageItem(demoVm.questionOrder);
                    demoVm.questionsStatus[currentPageItem].done = true;
                }
                var now = moment();
                var beginToNow = now.diff(demoVm.questionBeginTime, 'seconds');
                demoVm.savedTime += (demoVm.duration - beginToNow > 0) ? demoVm.duration - beginToNow : 0;
                demoVm.calculateCountDown(0);
                demoVm.stopCountDown();
                demoVm.hidingMessage = 'Đã tích lũy thời gian. Hãy chọn câu hỏi khác để thực hiện tiếp!';
                demoVm.hidingQuestion = true;
                demoVm.hideQuestionContent();
                break;
            case 4: //bonus time
                if (demoVm.questionFinished || demoVm.examFinished) return;

                demoVm.questionList[demoVm.questionOrder - 1].bonusTime += (demoVm.savedTime <= 0) ? 0 : ((demoVm.savedTime - 60 > 0) ? 60 : demoVm.savedTime);
                demoVm.savedTime = (demoVm.savedTime <= 0) ? 0 : ((demoVm.savedTime - 60 > 0) ? demoVm.savedTime - 60 : 0);
                demoVm.duration = parseInt(demoVm.timer) + parseInt(demoVm.questionList[demoVm.questionOrder - 1].bonusTime);
                demoVm.questionList[demoVm.questionOrder - 1].finished = false;
                demoVm.questionFinished = false;
                demoVm.stopCountDown(); //for the case, client is time out (user use helps  near end) but server check ok
                demoVm.myCountDown = $timeout(demoVm.runCountDown, 1000);
                break;
            case 5: //question again
                if (demoVm.examFinished || !demoVm.questionFinished || demoVm.disabledQuestionAgain) return;

                demoVm.questionList[demoVm.questionOrder - 1].bonusTime = 0;
                demoVm.duration = demoVm.questionList[demoVm.questionOrder - 1].timer;
                demoVm.questionBeginTime = demoVm.questionList[demoVm.questionOrder - 1].questionBeginTime = moment();
                demoVm.questionList[demoVm.questionOrder - 1].finished = false;
                demoVm.questionFinished = false;
                demoVm.reducedAnswers = [];
                demoVm.disabledReduceSelection = false; //reduce selection is used only one time
                demoVm.runQuestionAgain();
                break;
        }
    };

    //do help reduce selection
    demoVm.helpReduceSelection = function (reducedAnswers) {
        switch (demoVm.questionType) {
            case 0: //single choice
            case 1: //multiple choice
                //data must be array
                if (reducedAnswers.length == 0) {
                    return;
                }

                demoVm.reducedAnswers = reducedAnswers;

                //reset select
                if (demoVm.questionType == 0) {
                    //single choice
                    demoVm.selectedRadio = -1;
                } else {
                    //multiple choice
                    for(var checkboxId in demoVm.selectedCheckbox) {
                        // skip loop if the property is from prototype
                        if (!demoVm.selectedCheckbox.hasOwnProperty(checkboxId)) continue;

                        demoVm.selectedCheckbox[checkboxId] = false;
                    }
                }
                break;
            case 2: //essay
                break;
            case 3: //matching
                demoVm.matchedPairArray = reducedAnswers;
                $timeout(function() {
                    demoVm.drawConnect();
                });
                break;
        }
    };

    //hide question content because question have not been done yet, user can answer again. So data must be hided
    demoVm.hideQuestionContent = function() {
        demoVm.hidedSectionDescription = demoVm.sectionDescription;
        demoVm.hidedQuestionDescription = demoVm.questionDescription;
        demoVm.hidedAnswers = demoVm.answers;
        demoVm.sectionDescription = '';
        demoVm.questionDescription = '';
        demoVm.answers = [];
    };

    //do question again help
    demoVm.runQuestionAgain = function () {
        if (demoVm.hidingQuestion) {
            demoVm.sectionDescription = demoVm.hidedSectionDescription;
            demoVm.questionDescription = demoVm.hidedQuestionDescription;
            demoVm.answers = demoVm.hidedAnswers;

            //refresh mathjax equation
            $timeout(function(){
                MathJax.Hub.Queue(['Typeset', MathJax.Hub], function () {
                    demoVm.refreshAfterMathjax();
                });
            }, 0);
        }

        //scroll window to top
        $window.scrollTo(0, 0);

        demoVm.showQuestion = true;
        demoVm.hidingQuestion = false;

        demoVm.showAnswerKey = false;

        demoVm.stopCountDown();
        demoVm.myCountDown = $timeout(demoVm.runCountDown, 1000);
    };
    //</editor-fold>

    //go to other question
    demoVm.changeQuestion = function (order) {
        if (order < 1 || order > demoVm.numberQuestion || demoVm.questionsStatus == null) {
            return;
        }

        demoVm.questionOrder = order; //change to new order after close old question

        //get question in loaded question list
        demoVm.loadQuestion(order);
    };

    demoVm.medalLevel = 0;      //user's medal in exam result after finish exam
    demoVm.score = '';           //user's score
    demoVm.examResult = null;    //exam result
    //do finish exam
    demoVm.finishExam = function () {
        demoVm.questionOrder = parseInt(demoVm.numberQuestion) + 1;
        demoVm.currentOrder = demoVm.finishOrder;

        demoVm.hidingQuestion = false;
        demoVm.loadingQuestion = false;
        demoVm.loadingIcon = false;
        demoVm.finishPage = true;

        demoVm.questionFinished = true;
        demoVm.examFinished = true;

        demoVm.calculateCountDown(0);
        demoVm.stopCountDown();
        demoVm.countDownMode = 3;

        $window.scrollTo(0, 0);

        var examResult = {};
        var n = demoVm.questionList.length;
        var nCorrect = 0;
        var nAnswer = 0;
        var consumedTime = 0;
        var totalTime = 0;
        for(var i=0; i < n; i++) {
            switch (demoVm.questionList[i].questionType) {
                case 0: //single choice
                case 1: //multiple choice
                case 3: //matching
                    nAnswer = demoVm.questionList[i].answers.length;
                    for(var j=0; j < nAnswer; j++) {
                        if (demoVm.questionList[i].answers[j].isRight == false) {
                            break;
                        }
                    }
                    if (j == nAnswer) nCorrect++;
                    break;
                case 2: //essay
                    if (demoVm.questionList[i].answers[0].isRight == true) nCorrect++;
                    break;
            }

            consumedTime += demoVm.questionList[i].consumedTime;
            totalTime += demoVm.questionList[i].timer;
        }

        examResult['totalScore'] = examResult['totalQuestion'] = n;
        examResult['score'] = examResult['numberCorrect'] = nCorrect;
        examResult['consumedTime'] = consumedTime;
        examResult['totalTime'] = Math.max(totalTime, consumedTime);
        demoVm.prepareResultChart(examResult);
    };

    //display charts
    demoVm.correctChart = null;  //chart about number questions is correct
    demoVm.consumedTimeChart = null; //chart about consumed time
    demoVm.scoreChart = null;    //chart about score
    //init result chart
    demoVm.initResultChart = function () {
        demoVm.correctChart = {
            'labels': ['Đúng', 'Sai'],
            'colors': ['#00E676', '#DCDCDC'],
            'data': []
        };

        demoVm.consumedTimeChart = {
            'labels': ['Thời gian sử dụng', 'Còn lại'],
            'colors': ['#00ADF9', '#DCDCDC'],
            'data': []
        };

        demoVm.scoreChart = {
            'labels': ['Mức đạt', 'Mức chưa đạt'],
            'colors': ['#803690', '#DCDCDC'],
            'data': []
        };
    };

    //extract some chart value from exam result data
    demoVm.prepareResultChart = function (resultData) {
        demoVm.score = (resultData.score * 1).toString();

        demoVm.correctChart.data = [resultData.numberCorrect, resultData.totalQuestion - resultData.numberCorrect];
        demoVm.consumedTimeChart.data = [Math.round(resultData.consumedTime/60),
            Math.round(Math.max(0, resultData.totalTime - resultData.consumedTime)/60)];
        demoVm.scoreChart.data = [resultData.score, Math.max(0, resultData.totalScore - resultData.score)];

        var correctRate = (resultData.numberCorrect)/resultData.totalQuestion;
        var consumedTimeRate = (resultData.consumedTime)/resultData.totalTime;
        var scoreRate = (resultData.score)/resultData.totalScore;

        demoVm.medalLevel = 0;
        if (correctRate == 1 && scoreRate == 1) {
            demoVm.medalLevel = 5;
        } else if (correctRate >= 0.8 && scoreRate >= 0.8) {
            demoVm.medalLevel = 4;
        } else if (correctRate >= 0.6 && scoreRate >= 0.6 && consumedTimeRate <= 0.9) {
            demoVm.medalLevel = 3;
        } else if (correctRate >= 0.3 && scoreRate >= 0.3) {
            demoVm.medalLevel = 2;
        } else if (correctRate > 0 && scoreRate > 0) {
            demoVm.medalLevel = 1;
        }
    };

    demoVm.loadingIcon = false;  //flag to know whether display or not loading icon
    demoVm.displayLoadingIcon = function () {
        //fading loading few a time (while loading question). After about 5s, if question is unloaded, display waiting icon
        demoVm.loadingIcon = true;
        $scope.$digest();
    };

    //user change to other question
    demoVm.goToQuestion = function (order) {
        if (order < 1 || order > demoVm.numberQuestion || order == demoVm.currentOrder) {
            return;
        }

        var waitToSeeAnswerKey = 800;
        if (demoVm.questionFinished || demoVm.examFinished) {
            waitToSeeAnswerKey = 0;
        }

        demoVm.hidingQuestion = false;
        demoVm.closeQuestion();

        $timeout(function () {
            demoVm.loadingQuestion = true;
            if (order == demoVm.finishOrder) {
                if (demoVm.finishPage) return;
                demoVm.loadingOrder = 'HT';
                demoVm.finishExam();
            } else {
                demoVm.loadingQuestion = true;
                demoVm.loadingOrder = order;
                demoVm.changeQuestion(order);
            }
        }, waitToSeeAnswerKey);
    };

    //user click next button (right side) to go other question
    demoVm.goNext = function () {
        if (demoVm.questionOrder < demoVm.numberQuestion) {
            demoVm.goToQuestion(parseInt(demoVm.questionOrder) + 1);
        } else {
            demoVm.goToQuestion(demoVm.finishOrder);
        }
    };

    //user click previous button (left side) to go other question
    demoVm.goPrevious = function () {
        if (demoVm.questionOrder > 1) {
            demoVm.goToQuestion(demoVm.questionOrder - 1);
        }
    };

    //user pause question doing
    demoVm.exit = function () {
        demoVm.hidingMessage = 'Đang đóng bài thi...';
        demoVm.hidingQuestion = true;

        demoVm.closeQuestion();

        demoVm.questionFinished = true;
        demoVm.closing = true;

        $window.location.href = '/';
    };

    demoVm.shortcutKey = function () {
        $uibModal.open({
            animation: true,
            templateUrl: 'shortcutKeyModal.html',
            controller: 'shortcutKeyCtrl',
            controllerAs: 'shortcutKeyVm',
            keyboard: true,
            size: 'lg'
        });
    };

    demoVm.pressingCtrlAlt = false;

    $scope.$on('keydown', function(evt, obj){

        $scope.$apply(function () {
            demoVm.pressingCtrlAlt = obj.ctrlKey && obj.altKey;
        });

        if (demoVm.questionFinished && !demoVm.examFinished
            && obj.ctrlKey && obj.altKey && obj.key == 'l') {
            $scope.$apply(function () {
                demoVm.doHelp(5); //question again
            });
            return;
        }

        if ((obj.key == 'ArrowRight' || obj.key == 'Right') && obj.ctrlKey && obj.altKey) {
            $scope.$apply(function () {
                demoVm.goNext();
            });
            return;
        }

        if ((obj.key == 'ArrowLeft' || obj.key == 'Left') && obj.ctrlKey && obj.altKey) {
            $scope.$apply(function () {
                demoVm.goPrevious();
            });
            return;
        }

        if (demoVm.questionFinished || demoVm.examFinished) return;

        if (obj.ctrlKey && obj.altKey) {
            var helpType = -1;
            switch (obj.key) {
                case 'g':
                    helpType = 0; //reduce selection
                    break;
                case 't':
                    helpType = 1; //increase time
                    break;
                case 's':
                    helpType = 2; //answer later
                    break;
                case 'i':
                    helpType = 3; //save time
                    break;
                case 'x':
                    helpType = 4; //bonus time
                    break;
            }
            if (helpType != -1) {
                $scope.$apply(function () {
                    demoVm.doHelp(helpType);
                });
            }
            return;
        }

        var selectedOrder = null;
        var answerId = null;

        var matchSelection = false;
        if (obj.key >= '1' && obj.key <= '9') {
            selectedOrder = parseInt(obj.key);
            matchSelection = true;
        } else {
            selectedOrder = parseInt(obj.key, 36) - 9;//convert alphabet to order based 1
        }

        var nAnswer = demoVm.answers.length;
        for(var i=0; i < nAnswer; i++) {
            if (demoVm.answers[i].order == selectedOrder) {
                answerId = demoVm.answers[i].id;
                break;
            }
        }

        if (answerId == null) return;

        $scope.$apply(function () {
            switch (demoVm.questionType) {
                case 0: //single choice
                    demoVm.selectedRadio = answerId;
                    break;
                case 1: //multiple choice
                    demoVm.selectedCheckbox[answerId] = !demoVm.selectedCheckbox[answerId];
                    break;
                case 2: //essay
                    break;
                case 3: //matching
                    if (matchSelection) {
                        demoVm.selectMatch(answerId, null)
                    } else {
                        demoVm.selectAnswer(selectedOrder, null);
                    }
                    break;
            }
        });
    });

    $scope.$on('keyup', function(evt, obj){
        $scope.$apply(function () {
            demoVm.pressingCtrlAlt = false;
        });
    });
}]);
mainApp.controller('accessExamCtrl', ['$scope', '$timeout', '$window', 'InformationService', '$uibModalInstance', 'vcRecaptchaService', 'examInfo', function($scope, $timeout, $window, InformationService, $uibModalInstance, vcRecaptchaService, examInfo){    //modal to get information and access exam
    var accessExamVm = this; //view's model for detail controller
    accessExamVm.examInfo = examInfo;   //receive exam information from parent page
    accessExamVm.examInfo.remainCoin = accessExamVm.examInfo.userCoin - accessExamVm.examInfo.cost; //calculate remain coin

    accessExamVm.examPasswordMessage = '';         //password to access exam
    accessExamVm.userPasswordMessage = '';         //user's password
    accessExamVm.statusMessage = '';    //display status on top right corner
    accessExamVm.errorMessage = '';     //display status on left bottom corner

    accessExamVm.captchaMessage = '';
    accessExamVm.recaptchaResponse = '';
    accessExamVm.widgetId = null;
    accessExamVm.createReCaptcha = function (widgetId) {
        accessExamVm.captchaMessage = '';
        accessExamVm.widgetId = widgetId;
    };

    accessExamVm.successReCaptcha = function () {
        accessExamVm.captchaMessage = '';
    };

    accessExamVm.resetReCaptcha = function () {
        accessExamVm.captchaMessage = '';
        accessExamVm.recaptchaResponse = '';
        vcRecaptchaService.reload(accessExamVm.widgetId);
    };

    accessExamVm.accessing = false;     //accessing status flag
    /**
     * access exam
     */
    accessExamVm.doIt = function () {
        accessExamVm.examPassword = angular.isDefined(accessExamVm.examPassword) ? accessExamVm.examPassword.trim() : '';
        if(accessExamVm.examInfo.requiredExamPassword && accessExamVm.examPassword.length == 0) {
            accessExamVm.examPasswordMessage = 'Vui lòng nhập mã truy xuất đề thi';
            return;
        }

        accessExamVm.userPassword = angular.isDefined(accessExamVm.userPassword) ? accessExamVm.userPassword.trim(): '';
        if(accessExamVm.examInfo.cost > 0 && accessExamVm.userPassword.length == 0) {
            accessExamVm.userPasswordMessage = 'Vui lòng nhập mật khẩu tài khoản';
            return;
        }

        if(accessExamVm.examInfo.requiredCaptcha && accessExamVm.recaptchaResponse.length == 0) {
            accessExamVm.captchaMessage = 'Xác nhận bạn không phải là người máy';
            return;
        }

        accessExamVm.errorMessage = '';

        var infoService = new InformationService({id: accessExamVm.examInfo.examId});
        infoService['examPassword'] = accessExamVm.examPassword;
        infoService['userPassword'] = accessExamVm.userPassword;
        infoService['userCoin'] = accessExamVm.examInfo.userCoin;
        infoService['cost'] = accessExamVm.examInfo.cost;
        infoService['g-recaptcha-response'] = accessExamVm.recaptchaResponse;
        infoService['verificationCode'] = accessExamVm.examInfo.verificationCode;

        accessExamVm.accessing = true;
        infoService.$access(function successCallback(response){
            accessExamVm.accessing = false;
            if(response.success) {
                accessExamVm.errorMessage = '';
                accessExamVm.statusMessage = 'Đang chuyển kênh...';
                $window.location.href = '/u/exam/' + accessExamVm.examInfo.examId + '/dashboard/show';
            } else {
                accessExamVm.errorMessage = response['message'];
            }
        }, function errorCallback(response){
            accessExamVm.accessing = false;
            accessExamVm.errorMessage = 'Lỗi kết nối server';
            console.log('error');
            console.log(response);
        });

    };

    //close modal
    accessExamVm.close = function () {
        $uibModalInstance.close();
    };


}]);
mainApp.controller('infoCtrl', ['$scope', '$window', '$uibModal', '$timeout', 'InformationService', function($scope, $window, $uibModal, $timeout, InformationService){

    var infoVm = this;
    infoVm.query = ''; //query string on header

    //variables to hold requests for cancel request when go to other page
    infoVm.socialCountRequest = null;
    infoVm.userRatingRequest = null;
    infoVm.sameCreatorRequest = null;
    infoVm.similarExamRequest = null;

    /**
     * init information page with some init values which sent by server
     * @param data
     */
    infoVm.init = function (data) {
        console.log(data);
        infoVm.userId = data.userId;
        infoVm.activatedAccount = data.activatedAccount;
        infoVm.examId = data.examId;
        infoVm.creatorId = data.creatorId;
        infoVm.titleWords = angular.isDefined(data.title) ? data.title.split(/[, ]+/) : ''; //for search similar exam
        infoVm.available = data.available; //is exam still available for new access (publish after exam or if not, now before end)
        infoVm.requireExamPassword = data.requireExamPassword; //does exam require password to access
        infoVm.requiredCaptcha = data.requiredCaptcha; //does verify use captcha
        infoVm.requiredVerification = data.requiredVerification; //if exam cost larger than limit, user must be confirmed by email before continue.
        infoVm.userCoin = data.userCoin; //does exam require password to access
        infoVm.cost = data.cost;
        infoVm.isBegan = data.isBegan;

        infoVm.untilToBegin = data.untilToBegin;
        infoVm.countUpPoint = moment();

        infoVm.permitted = data.permitted;

        infoVm.accessed = data.accessed;

        //get user voting
        $timeout(infoVm.getSocialCounts);

        //creator can not vote for his exam
        if (infoVm.userId != infoVm.creatorId) {
            $timeout(infoVm.getUserRating);
        }

        //load exams which is same creator
        $timeout(infoVm.loadSameCreatorExams);

        //load exams which similar with current exam
        $timeout(infoVm.loadSimilarExams);
    };

    infoVm.accessExamMessage = '';  //access message
    infoVm.accessing = false;       //access flag to know accessing status
    /**
     * user access exam
     */
    infoVm.accessExam = function () {
        infoVm.accessExamMessage = '';
        if (infoVm.userId == null) {
            infoVm.accessExamMessage = 'Bạn chưa đăng nhập';
            return;
        }

        if (!infoVm.activatedAccount) {
            infoVm.accessExamMessage = 'Tài khoản của bạn chưa được kích hoạt';
            return;
        }

        //check exam began
        //put code here because prevent old user who access exam a long time ago
        if (infoVm.creatorId != infoVm.userId  && infoVm.untilToBegin > 0) {
            var now = moment();
            var countUpToNow = now.diff(infoVm.countUpPoint, 'seconds');
            if(countUpToNow < infoVm.untilToBegin) {
                infoVm.accessExamMessage = 'Đề thi chưa bắt đầu.';
                return;
            }
        }

        if (infoVm.accessed) {
            //access directly because user accessed before
            infoVm.cancelAllRequests();
            infoVm.accessing = true;
            $window.location.href = '/u/exam/' + infoVm.examId + '/dashboard/show';
        } else {
            if (infoVm.creatorId != infoVm.userId  && infoVm.cost > infoVm.userCoin) {
                infoVm.accessExamMessage = 'Bạn không đủ xu để thực hiện.';
                return;
            }

            if (infoVm.creatorId != infoVm.userId && !infoVm.permitted) {
                infoVm.accessExamMessage = 'Đề thi giới hạn chỉ những người trong danh sách.';
                return;
            }

            if (!infoVm.available) {
                infoVm.accessExamMessage = 'Đề thi đã đóng';
                return;
            }

            if (infoVm.requiredVerification) {
                //if exam have cost larger than max coin, user must verify confirmation code
                var codeModalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'verificationCodeModal.html',
                    controller: 'verificationCodeCtrl',
                    controllerAs: 'verificationCodeVm',
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        examInfo: function () {
                            return {
                                examId: infoVm.examId
                            };
                        }
                    }
                });

                codeModalInstance.result.then(function (result) {
                    if (result.success) {
                        infoVm.verificationCode = result.code;
                        infoVm.payExam();
                    }

                });
            } else {
                infoVm.payExam();
            }
        }
    };

    infoVm.verificationCode = '';
    infoVm.payExam = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'accessExamModal.html',
            controller: 'accessExamCtrl',
            controllerAs: 'accessExamVm',
            keyboard: false,
            openedClass: (infoVm.cost > 0 && infoVm.requireExamPassword) ? 'cq-information' : 'modal-open',
            backdrop: 'static',
            resolve: {
                examInfo: function () {
                    return {
                        examId: infoVm.examId,
                        userId: infoVm.userId,
                        creatorId: infoVm.creatorId,
                        userCoin: infoVm.userCoin,
                        cost: infoVm.cost,
                        requiredExamPassword: infoVm.requireExamPassword,
                        requiredCaptcha: infoVm.requiredCaptcha,
                        requiredVerification: infoVm.requiredVerification,
                        verificationCode: infoVm.verificationCode
                    };
                }
            }
        });

        modalInstance.result.then(function () {
            //if user do not access, get information again because some request maybe discarded in accessing progress.
            infoVm.getInformationAgain();
        });
    };

    /**
     * search exam on header bar
     */
    infoVm.searchExam = function () {
        infoVm.query = infoVm.query.trim();
        if (infoVm.query.length === 0 ) return;

        $window.location.href = '/search?q=' + infoVm.query;
    };

    //<editor-fold desc="voting exam">
    infoVm.rateMessage = '';    //rating message to info error if any
    infoVm.rateLoaded = false;  //flag to know when rating is loaded from server
    infoVm.starRating = 0;      //star rating
    infoVm.hoverRating = 0;     //hover rating (temp rating when user hover star icons)
    infoVm.comment = '';        //user comment

    /**
     * get exam rating and comment from server
     */
    infoVm.getUserRating = function () {
        //user must be log in
        if (infoVm.userId != null) {
            infoVm.userRatingRequest = InformationService.rating({'id': infoVm.examId}, function successCallback(response){
                if (angular.isDefined(response.data)) {
                    infoVm.starRating = response.data.vote_point;
                    infoVm.comment = response.data.vote_comment;
                }
                infoVm.rateLoaded = true;
            }, function errorCallback(response) {
                infoVm.rateLoaded = false;
            });
        }
    };

    /**
     * user change exam rating
     * @param param
     */
    infoVm.clickStar = function (param) {
        if (infoVm.userId != null) {
            var infoService = new InformationService({'id': infoVm.examId});
            infoService['vote_point'] = param;

            infoService.$updateVotePoint(function successCallback(response){
                if (response.success == false) {
                    infoVm.starRating = 0;
                    infoVm.rateMessage = 'Bạn chưa thực hiện bài kiểm tra';
                }
            }, function errorCallback(response) {
                infoVm.rateMessage = 'Không kết nối được với server';
            });
        }
    };

    /**
     * user change exam comment
     */
    infoVm.updateComment = function() {
        if (infoVm.userId != null) {
            var infoService = new InformationService({'id': infoVm.examId});
            infoService['vote_comment'] = infoVm.comment;

            infoService.$updateComment(function successCallback(response){
                if (response.success == false) {
                    infoVm.commentMessage = 'Bạn chưa thực hiện bài kiểm tra';
                }
            }, function errorCallback(response) {
                infoVm.commentMessage = 'Không kết nối được với server';
            });
        }
    };

    /**
     * event when mouse hover on star icons
     * @param param
     */
    infoVm.mouseHoverStar = function (param) {
        infoVm.hoverRating = param;
    };

    /**
     * event when mouse leave off star icons
     * @param param
     */
    infoVm.mouseLeaveStar = function (param) {
        infoVm.hoverRating = param + '*';
    };
    //</editor-fold>

    //<editor-fold desc="other exams">
    //same creator exam
    infoVm.sameCreator = {
        exams: [],
        examIdList: [],
        slides: [],
        currentSlideIdx: 0,
        currentPage: 1,
        lastPage: 0,
        loading: false,
        loadFn: function () {
            infoVm.loadSameCreatorExams();
        }
    };
    infoVm.sameCreatorLoaded = false;
    infoVm.loadSameCreatorExams = function () {
        //get same creator exam with page
        var postData = {
            creatorId : infoVm.creatorId
        };

        if (infoVm.sameCreator.lastPage != 0) {
            if (infoVm.sameCreator.currentPage >= infoVm.sameCreator.lastPage) {
                return;
            } else {
                postData['page'] = parseInt(infoVm.sameCreator.currentPage) + 1;
            }
        } else {
            postData['page'] = infoVm.sameCreator.currentPage;
        }

        infoVm.sameCreator.loading = true;
        infoVm.sameCreatorRequest = InformationService.loadSameCreatorExam({'id': infoVm.examId}, postData, function successCallback(response){
            if (angular.isDefined(response.result)) {
                infoVm.sameCreator.currentPage = response.result.current_page;
                infoVm.sameCreator.lastPage = response.result.last_page;
                if (response.result.prev_page_url == null) {
                    infoVm.sameCreator.currentSlideIdx = 0;
                }
                //add more same creator exam to list
                for (var i=0; i<response.result.data.length; i++){
                    if (infoVm.sameCreator.examIdList.indexOf(response.result.data[i].id) == -1
                        && response.result.data[i].id != infoVm.examId) {
                        infoVm.sameCreator.exams.push(response.result.data[i]);
                        infoVm.sameCreator.examIdList.push(response.result.data[i].id);
                    }
                }

                infoVm.identifyNumberExamPerSlide();
                infoVm.buildSlide(infoVm.sameCreator);  //build card slide
                infoVm.sameCreatorLoaded = true;
            }
            infoVm.sameCreator.loading = false;
        }, function errorCallback(response) {
            infoVm.sameCreator.loading = false;
        });
    };

    //similar exam
    infoVm.similarExams = {
        exams: [],
        examIdList: [],
        slides: [],
        currentSlideIdx: 0,
        currentTitleIdx: 0,
        step: 2,
        loading: false,
        loadFn: function() {
            infoVm.loadSimilarExams();
        }
    };
    infoVm.similarExamsLoaded = false;
    infoVm.loadSimilarExams = function () {
        //if title word is too short, don't get similar exam
        if (infoVm.titleWords.length < 2) {
            infoVm.similarExams.loading = false;
            return;
        }

        //identify word length from title to extract and search similar exams
        //begin with 2-gram, 3-gram, 4-gram, last with 1-gram
        if (infoVm.similarExams.currentTitleIdx + infoVm.similarExams.step > infoVm.titleWords.length) {
            if (infoVm.similarExams.step == 2) {
                infoVm.similarExams.step++;
            } else if (infoVm.similarExams.step == 3) {
                infoVm.similarExams.step++;
            } else if (infoVm.similarExams.step == 4) {
                //limit is step 4
                infoVm.similarExams.step = 1;
            } else {
                infoVm.similarExams.loading = false;
                return;
            }
            infoVm.similarExams.currentTitleIdx = 0;
        }

        //construct query base on word length
        var query = '';
        for(var i = 0; i < infoVm.similarExams.step; i++) {
            query += infoVm.titleWords[infoVm.similarExams.currentTitleIdx + i] + ' ';
        }
        query = query.trim();
        infoVm.similarExams.currentTitleIdx++;

        var q = (query.length > 255) ? substr(query, 0, 255) : query;

        infoVm.similarExams.loading = true;

        //request to get similar exams from server
        infoVm.similarExamRequest = InformationService.loadSimilarExam({'id': infoVm.examId}, {'q' : q}, function successCallback(response){
            infoVm.similarExams.loading = false; //must before call recursive
            if (angular.isDefined(response.result)) {
                var count = 0;
                for (var i=0; i<response.result.length; i++){
                    if (infoVm.similarExams.examIdList.indexOf(response.result[i].id) == -1
                        && response.result[i].id != infoVm.examId) {
                        infoVm.similarExams.exams.push(response.result[i]);
                        infoVm.similarExams.examIdList.push(response.result[i].id);
                        count++;
                    }
                }

                if (count == 0) {
                    if (infoVm.similarExams.currentTitleIdx + infoVm.similarExams.step < infoVm.titleWords.length) {
                        infoVm.loadSimilarExams();
                    }
                } else {
                    infoVm.identifyNumberExamPerSlide();
                    infoVm.buildSlide(infoVm.similarExams);
                }
                infoVm.similarExamsLoaded = true;
            }
        }, function errorCallback(response) {
            infoVm.similarExams.loading = false;
        });
    };

    //traverse carousel
    infoVm.goNextSlide = function(carousel) {
        if (carousel.loading) return;

        if (carousel.currentSlideIdx + 1 >= carousel.slides.length) {
            carousel.currentSlideIdx = carousel.slides.length - 1;
        } else {
            carousel.currentSlideIdx++;
        }

        if (carousel.currentSlideIdx >= carousel.slides.length - 2) {
            carousel.loadFn();
        }
    };

    infoVm.goPreviousSlide = function(carousel) {
        carousel.currentSlideIdx = (carousel.currentSlideIdx <= 0) ? 0 : carousel.currentSlideIdx-1;
    };

    //detect window size change and update slide
    infoVm.myWindow = angular.element($window);
    infoVm.myWindow.on('resize', function() {
        infoVm.identifyNumberExamPerSlide();
        infoVm.buildSlide(infoVm.sameCreator);
        infoVm.buildSlide(infoVm.similarExams);
        // don't forget manually trigger $digest()
        $scope.$digest();
    });

    infoVm.numberExamPerSlide = 0;
    infoVm.oldExamPerSlide = 0;
    infoVm.identifyNumberExamPerSlide = function () {
        //all magic width in this function is identified by experience (manually)
        var width = infoVm.myWindow.width();
        infoVm.oldExamPerSlide = infoVm.numberExamPerSlide;
        if(width > 974) {
            // desktop (col-lg-3)
            infoVm.numberExamPerSlide = 4;
        } else if(width <= 974 && width > 750) {
            // tablet (col-md-4)
            infoVm.numberExamPerSlide = 3;
        } else if (width <= 750 && width > 526) {
            // phone (col-sm-6)
            infoVm.numberExamPerSlide = 2;
        } else {
            // small (xs)
            infoVm.numberExamPerSlide = 1;
        }
    };

    //build carousel slide
    infoVm.buildSlide = function(carousel) {
        carousel.slides = infoVm.rebuildSlide(carousel.exams, infoVm.numberExamPerSlide);
        if (infoVm.oldExamPerSlide != 0) {
            carousel.currentSlideIdx = Math.round(((carousel.currentSlideIdx+1) * infoVm.oldExamPerSlide)/infoVm.numberExamPerSlide) - 1;

            //reset if wrong
            if (carousel.currentSlideIdx > carousel.slides.length - 1) {
                carousel.currentSlideIdx = carousel.slides.length - 1;
            }

            if (carousel.currentSlideIdx < 0) {
                carousel.currentSlideIdx = 0;
            }
        }
    };

    //rebuild slide if window size change
    infoVm.rebuildSlide = function(items, n) {
        var examCollection = [], slide = {}, exams = [], index;
        var identify = '';
        for(index = 0; index < items.length; index++) {
            if(exams.length === n) {
                slide.identify = identify;
                slide.exams = exams;
                examCollection.push(slide);
                slide = {};
                exams = [];
                identify = '';
            }
            exams.push(items[index]);
            identify = identify + items[index].id;
        }
        slide.identify = identify;
        slide.exams = exams;
        examCollection.push(slide);
        return examCollection;
    };

    //calculate exam star (voting)
    infoVm.getStar = function (vote_sum, vote_num) {
        var n = (vote_num == 0) ? 0 : Math.round(vote_sum/vote_num);
        return new Array(n);
    };

    infoVm.getUnStar = function (vote_sum, vote_num) {
        var n = (vote_num == 0) ? 5 : 5 - Math.round(vote_sum/vote_num);
        return new Array(n);
    };
    //</editor-fold>

    //<editor-fold desc="social counts">
    infoVm.facebookCount = '';
    infoVm.twitterCount = '';
    infoVm.gplusCount = '';
    infoVm.stumbleCount = '';
    infoVm.socialCountLoaded = false;
    infoVm.getSocialCounts = function() {
        infoVm.socialCountRequest = InformationService.socialCount({'id': infoVm.examId}, function successCallback(response){
            if (angular.isDefined(response.data)) {
                infoVm.facebookCount = response.data.facebook;
                infoVm.twitterCount = response.data.twitter;
                infoVm.gplusCount = response.data.gplus;
                infoVm.stumbleCount = response.data.stumble;
                infoVm.socialCountLoaded = true;
            }
        }, function errorCallback(response) {
            // console.log('error SocialCounts');
            // console.log(response);
        });
    };
    //</editor-fold>

    /**
     * Cancel all unfinished requests when user want to access exam
     */
    infoVm.cancelAllRequests = function () {
        if (infoVm.socialCountRequest != null) {
            infoVm.socialCountRequest.$cancelRequest();
        }

        if (infoVm.userRatingRequest != null) {
            infoVm.userRatingRequest.$cancelRequest();
        }

        if (infoVm.sameCreatorRequest != null) {
            infoVm.sameCreatorRequest.$cancelRequest();
        }

        if (infoVm.similarExamRequest != null) {
            infoVm.similarExamRequest.$cancelRequest();
        }
    };

    /**
     * when user access exam, all requests will be canceled.
     * If user cancel access, unknown information will be request again
     */
    infoVm.getInformationAgain = function () {
        if (!infoVm.rateLoaded && infoVm.userId != infoVm.creatorId) {
            infoVm.getUserRating();
        }

        if (!infoVm.socialCountLoaded) {
            infoVm.getSocialCounts();
        }

        if (!infoVm.sameCreatorLoaded) {
            infoVm.loadSameCreatorExams();
        }

        if (!infoVm.similarExamsLoaded) {
            infoVm.loadSimilarExams();
        }
    };
}]);
mainApp.controller('verificationCodeCtrl', ['$scope', '$uibModalInstance', 'InformationService', 'examInfo', function($scope, $uibModalInstance, InformationService, examInfo){
    var verificationCodeVm = this; //view's model for detail controller
    verificationCodeVm.examId = examInfo.examId;
    verificationCodeVm.code = '';
    verificationCodeVm.statusMessage = '';
    verificationCodeVm.requested = false;
    verificationCodeVm.processing = false;

    verificationCodeVm.init = function () {
        InformationService.requestVerification({id: verificationCodeVm.examId}, function successCallback(response) {
            if (response.success) {
                verificationCodeVm.requested = true;
            } else {
                verificationCodeVm.statusMessage = response.message;
            }
        }, function errorCallback(response) {
            verificationCodeVm.statusMessage = 'Lỗi không thể gửi yêu cầu xác nhận.';
        });
    };
    verificationCodeVm.init();

    verificationCodeVm.cancel = function () {
        $uibModalInstance.close({
            'success': false,
            'code': ''
        });
    };

    verificationCodeVm.finish = function () {
        if (verificationCodeVm.code == ''
            || verificationCodeVm.code.length != 16) {
            verificationCodeVm.statusMessage = 'Mã không hợp lệ';
            return;
        }

        verificationCodeVm.processing = true;
        verificationCodeVm.statusMessage = 'Hệ thống đang kiểm tra mã...';
        InformationService.verifyCode({id: verificationCodeVm.examId}, {code: verificationCodeVm.code}, function successCallback(response) {
            if (response.success) {
                $uibModalInstance.close({
                    'success': true,
                    'code': verificationCodeVm.code
                });
            } else {
                verificationCodeVm.statusMessage = 'Mã không khớp.';
            }
            verificationCodeVm.processing = false;
        }, function errorCallback(response) {
            verificationCodeVm.statusMessage = 'Lỗi kiểm tra mã.';
            verificationCodeVm.processing = false;
        });
    };

}]);
mainApp.controller('leaderBoardMajorCtrl', ['$scope', '$timeout', 'LeaderBoardService', function($scope, $timeout, LeaderBoardService){

    var leaderBoardMajorVm = this;
    leaderBoardMajorVm.statusMessage = '';
    leaderBoardMajorVm.students = null;

    leaderBoardMajorVm.init = function (data) {
        console.log(data);
        leaderBoardMajorVm.examId = data.examId;
        leaderBoardMajorVm.creatorId = data.creatorId;
        leaderBoardMajorVm.page = 0;
        leaderBoardMajorVm.students = [];
        $timeout(leaderBoardMajorVm.loadLeaderBoard);
    };

    leaderBoardMajorVm.leaderBoardRequest = null;
    leaderBoardMajorVm.loadLeaderBoard = function() {
        leaderBoardMajorVm.loading = true;
        leaderBoardMajorVm.leaderBoardRequest = LeaderBoardService.loadLeaderBoard({'id': leaderBoardMajorVm.examId}, function successCallback(response){
            leaderBoardMajorVm.loading = false;
            if (response.success) {
                leaderBoardMajorVm.students = response.data;
                leaderBoardMajorVm.page = 1;
            }
        }, function errorCallback(response) {
            leaderBoardMajorVm.loading = false;
            console.log('error');
            console.log(response);
        });
    };

    leaderBoardMajorVm.loading = false;
    leaderBoardMajorVm.leaderBoardMoreRequest = null;
    leaderBoardMajorVm.loadMoreStudent = function () {
        leaderBoardMajorVm.loading = true;
        leaderBoardMajorVm.leaderBoardMoreRequest = LeaderBoardService.loadMoreStudent({id: leaderBoardMajorVm.examId, page: leaderBoardMajorVm.page + 1}, function successCallback(response){
            leaderBoardMajorVm.loading = false;
            if(response.success) {
                leaderBoardMajorVm.page++;
                leaderBoardMajorVm.students = leaderBoardMajorVm.students.concat(response.data);
            }
        }, function errorCallback(response){
            leaderBoardMajorVm.loading = false;
            leaderBoardMajorVm.statusMessage = 'Lỗi kết nối server';
            console.log('error');
            console.log(response);
        });
    };

    $scope.$on('$locationChangeSuccess', function (event, current, previous) {
        //compare after remove hash
        if (current.split('#')[0] == previous.split('#')[0]) return;

        if (leaderBoardMajorVm.leaderBoardRequest != null) {
            leaderBoardMajorVm.leaderBoardRequest.$cancelRequest();
        }

        if (leaderBoardMajorVm.leaderBoardMoreRequest != null) {
            leaderBoardMajorVm.leaderBoardMoreRequest.$cancelRequest();
        }
    });

}]);
mainApp.controller('confirmFinishCtrl', ['$scope', '$uibModalInstance', function($scope, $uibModalInstance){
    //modal to confirm finish exam by user
    var confirmFinishVm = this; //view's model for detail controller

    confirmFinishVm.cancel = function () {
        $uibModalInstance.close(false);
    };

    confirmFinishVm.finish = function () {
        $uibModalInstance.close(true);
    };
}]);
mainApp.controller('reduceSelectionCtrl', ['$scope', '$uibModalInstance', 'questionOrder', 'cost', function($scope, $uibModalInstance, questionOrder, cost){
    //modal to reduce selection in display whole exam
    var reduceSelectionVm = this; //view's model for detail controller
    reduceSelectionVm.questionOrder = questionOrder;
    reduceSelectionVm.cost = cost;

    reduceSelectionVm.cancel = function () {
        $uibModalInstance.close(false);
    };

    reduceSelectionVm.finish = function () {
        $uibModalInstance.close(true);
    };

}]);
mainApp.controller('runExamCtrl', ['$scope', '$window', '$location', '$timeout', '$animate', '$uibModal', '$anchorScroll', 'Fullscreen', 'RunService', function($scope, $window, $location, $timeout, $animate, $uibModal, $anchorScroll, Fullscreen, RunService){
    var runExamVm = this;
    runExamVm.statusMessage = '';
    runExamVm.updateTryTime = 0; //when user can not send answer to server, try again some times.
    runExamVm.maxTryTime = 60;

    //init Mathjax for display in detail panel only output to SVG type (not CHTML because user can drag and drop into equation and modify it)
    MathJax.Hub.Queue(["setRenderer", MathJax.Hub, "SVG"]);

    runExamVm.loadingExam = false;  //flag to know question is loaded finish
    runExamVm.finishPage = false;   //flag to know current page is normal page to display question or finish page to display statistic result
    //init question page with data from server
    runExamVm.init = function (data) {
        console.log(data);

        runExamVm.countDownMode = 1;

        //check whether user is creator. If true, behavior will be difference.
        runExamVm.userIsCreator = data.userIsCreator;
        runExamVm.backPage = data.backPage;

        //general exam information (load one time only)
        runExamVm.examId = data.examId;
        runExamVm.coin = data.coin * 1; //remove 0 padding if any
        runExamVm.timeWholeExam = data.timeWholeExam;

        runExamVm.reduceSelectionCost = data.reduceSelectionCost;
        runExamVm.remainReduceSelection = data.remainReduceSelection;

        runExamVm.numberQuestion = data.numberQuestion;

        runExamVm.timeZone = data.timeZone;

        runExamVm.showNumberSelection = data.showNumberSelection;

        runExamVm.loadingExam = true;

        var order = parseInt(data.order, 10);
        if (isNaN(order) || order < 1 || order > data.numberQuestion) {
            runExamVm.beginOrder = 1;
        } else {
            runExamVm.beginOrder = order;
        }

        //remove init div
        var initElm = angular.element(document.querySelector('#cq-run-init'));
        initElm.remove();

        //request question status to display question pagination
        $timeout(runExamVm.loadAllQuestion);

        //init result chart variables
        $timeout(runExamVm.initResultChart);
    };

    //<editor-fold desc="load and display question"
    /**
     * load all question in exam for display whole exam
     */
    runExamVm.loadAllQuestion = function () {
        var runService = new RunService({examId: runExamVm.examId});
        runService['beginOrder'] = runExamVm.beginOrder;

        runService.$loadAllQuestion(function successCallback(response){
           console.log(response);
            if (response.success) {
                runExamVm.questionsStatus = response.data.questionsStatus;

                //calculate duration and set question begin time, timer, bonus
                // runExamVm.examBeginTime = moment.tz(response.data.examBeginTime, runExamVm.timeZone);
                // runExamVm.examEndTime = (response.data.examEndTime != null) ? moment.tz(response.data.examEndTime, runExamVm.timeZone) : null;
                // var durationFromEnd = (runExamVm.examEndTime != null) ? runExamVm.examEndTime.diff(runExamVm.examBeginTime, 'seconds') : null;
                // if (durationFromEnd != null && durationFromEnd >=0 && durationFromEnd < response.data.duration) {
                //     runExamVm.duration = durationFromEnd;
                // } else {
                //     runExamVm.duration = response.data.duration;
                // }

                runExamVm.remainTime = response.data.remainTime;

                runExamVm.examFinished = response.data.examFinished;

                //check whether show answer key or not
                runExamVm.showAnswerKey = response.data.showAnswerKey;
                if (!runExamVm.showAnswerKey) {
                    runExamVm.encryptKey = response.data.encryptKey;
                    runExamVm.iv = response.data.iv;
                }

                //non display count down mode when exam is finished
                //runExamVm.countDownMode = (response.data.examFinished) ? 3 : 1;

                //store loaded sections
                runExamVm.loadedSections = response.data.sections;

                //load a part of sections (not all section because delay display)
                //other sections will be load when user scroll to
                runExamVm.loadSection(response.data.loadToSection, runExamVm.beginOrder);
            } else {
                runExamVm.loadingExam = false;
                runExamVm.hidingExam = true;
                //runExamVm.hidingMessage = 'Hệ thống gặp vấn đề. Vui lòng thử lại';
                runExamVm.hidingMessage = 'Bạn vui lòng kiểm tra lại thiết lập. Nếu thiết lập trình diễn tất cả câu hỏi, thì cách tích thời gian là toàn bài.';
            }
        }, function errorCallback(response){
            console.log('error');
            console.log(response);
            runExamVm.loadingExam = false;
            runExamVm.hidingExam = true;
            runExamVm.hidingMessage = 'Không kết nối được với máy chủ. Vui lòng thử lại';
        });
    };

    runExamVm.sections = []; //section is displayed on web page (infinite scrolling)
    runExamVm.loadedSections = []; //sections is loaded to client
    //load some sections to view (first time to display questions)
    runExamVm.loadSection = function(loadToSection, questionOrder) {
        var n = runExamVm.loadedSections.length;
        if (runExamVm.loadedSections.length - runExamVm.sections.length > 5) {
            n = runExamVm.sections.length + 5;
        }

        if (n < loadToSection) {
            n = loadToSection;
        }

        for (var i = runExamVm.sections.length; i < n; i++) {
            runExamVm.sections.push(runExamVm.loadedSections[i]);
        }

        runExamVm.currentOrder = questionOrder;
        runExamVm.displayPagePagination();

        $timeout(function(){
            //refresh mathjax
            MathJax.Hub.Queue(['Typeset', MathJax.Hub], function () {
                //update view after mathjax is refreshed

                $location.search('order', runExamVm.currentOrder).hash('question-' + runExamVm.currentOrder).replace();
                $anchorScroll.yOffset = 135;
                $anchorScroll();

                runExamVm.loadingExam = false;

                runExamVm.calculateCountDown(0);
                runExamVm.stopCountDown(); //stop count down of previous question
                if (!runExamVm.examFinished) {
                    runExamVm.startPoint = moment();
                    runExamVm.myCountDown = $timeout(runExamVm.runCountDown, 1000);
                }

                runExamVm.reDrawAllConnect();

                runExamVm.checkHelps();

                $scope.$digest();
            });
        }, 0);
    };

    //load more sections to view
    runExamVm.loadMoreSection = function() {
        if (runExamVm.loadedSections.length == runExamVm.sections.length) {
            return;
        }

        //Infinite scroll in with ngInfiniteScroll
        var n = runExamVm.loadedSections.length;
        if (runExamVm.loadedSections.length - runExamVm.sections.length > 10) {
            n = runExamVm.sections.length + 10;
        }

        for (var i = runExamVm.sections.length; i < n; i++) {
            runExamVm.sections.push(runExamVm.loadedSections[i]);
        }

        $timeout(function(){
            MathJax.Hub.Queue(['Typeset', MathJax.Hub], function () {
                runExamVm.reDrawAllConnect();

                $scope.$digest();
            });
        }, 0);
    };

    runExamVm.getNameFromNumber = function (num) {
        var numeric = (num - 1) % 26;
        var letter = String.fromCharCode(65 + numeric);
        var num2 = Math.floor((num - 1) / 26);
        if (num2 > 0) {
            return runExamVm.getNameFromNumber(num2) + letter;
        } else {
            return letter;
        }
    };
    //</editor-fold>

    //<editor-fold desc="display pagination">
    runExamVm.questionsStatus = null;
    runExamVm.pages = {};   //question page status is displaying on header bar
    runExamVm.currentOrder = 1; //current question order
    runExamVm.pages.previous = false;   //previous button is display or not
    runExamVm.pages.next = false;   //next button is display or not
    runExamVm.pages.viewFrame = []; //current view frame
    /**
     * display question list pagination
     */
    runExamVm.displayPagePagination = function () {
        if (runExamVm.questionsStatus == null) return;

        runExamVm.identifyNumberItemPerPage();
        var currentPageItem = runExamVm.identifyPageItem(runExamVm.currentOrder);

        var middle =  runExamVm.numberItemPerPage/2;
        //if page index larger than mid, it will be stand on position mid
        var firstPage = (currentPageItem > middle) ? (currentPageItem - middle) : 0;

        //from firstPage...numberItemPerPage
        var n = Math.min(firstPage + runExamVm.numberItemPerPage, runExamVm.questionsStatus.length);
        var k = Math.max(n - runExamVm.numberItemPerPage, 0);
        runExamVm.pages.viewFrame = [];
        for (var i = k; i<n; i++) {
            if (angular.isDefined(runExamVm.questionsStatus[i])) {
                var page = {};
                page.order = runExamVm.questionsStatus[i]['order'];
                page.id = runExamVm.questionsStatus[i]['id'];
                page.sectionId = runExamVm.questionsStatus[i]['sectionId'];
                page.done = runExamVm.questionsStatus[i]['done'];
                runExamVm.pages.viewFrame.push(page);
            }
        }

        //add finish button to question status bar if user go to last view frame
        runExamVm.addFinishPageToFrame(n);

        //check enable/disable previous/next button
        runExamVm.pages.previous = (k > 0);
        runExamVm.pages.next = (n < runExamVm.questionsStatus.length);
    };

    runExamVm.finishOrder = 'Hoàn thành';   //finish button label
    //add finish button to current view frame (last view frame)
    runExamVm.addFinishPageToFrame = function (lastItem) {
        //if current view frame is last view, display finish button
        if (lastItem == runExamVm.questionsStatus.length) {
            var finishPageItem = {};
            finishPageItem.order = runExamVm.finishOrder;
            finishPageItem.id = null;
            finishPageItem.sectionId = null;
            finishPageItem.done = false;
            runExamVm.pages.viewFrame.push(finishPageItem);
        }
    };

    /**
     * user click previous button to view previous frame
     */
    runExamVm.viewPreviousFrame = function () {
        var firstPageItem = runExamVm.identifyPageItem(runExamVm.pages.viewFrame[0].order);

        if (firstPageItem == 0) return;

        var k = Math.max(firstPageItem - runExamVm.numberItemPerPage, 0);
        var n = Math.min(k + runExamVm.numberItemPerPage, runExamVm.questionsStatus.length);
        runExamVm.pages.viewFrame = [];
        for (var i=k; i<n; i++) {
            if (angular.isDefined(runExamVm.questionsStatus[i])) {
                var page = {};
                page.order = runExamVm.questionsStatus[i]['order'];
                page.id = runExamVm.questionsStatus[i]['id'];
                page.sectionId = runExamVm.questionsStatus[i]['sectionId'];
                page.done = runExamVm.questionsStatus[i]['done'];
                runExamVm.pages.viewFrame.push(page);
            }
        }

        runExamVm.addFinishPageToFrame(n);

        runExamVm.pages.previous = (k > 0);
        runExamVm.pages.next = (n < runExamVm.questionsStatus.length);
    };

    /**
     * user click next button to view next frame
     */
    runExamVm.viewNextFrame = function () {
        var lastPageItemOrder = runExamVm.pages.viewFrame[runExamVm.pages.viewFrame.length - 1].order;
        if (lastPageItemOrder == runExamVm.finishOrder) return;

        var lastPageItem = runExamVm.identifyPageItem(lastPageItemOrder);

        var n = Math.min(lastPageItem + runExamVm.numberItemPerPage, runExamVm.questionsStatus.length);
        var k = Math.max(n - runExamVm.numberItemPerPage, 0);
        runExamVm.pages.viewFrame = [];
        for (var i = k; i< n; i++) {
            if (angular.isDefined(runExamVm.questionsStatus[i])) {
                var page = {};
                page.order = runExamVm.questionsStatus[i]['order'];
                page.id = runExamVm.questionsStatus[i]['id'];
                page.sectionId = runExamVm.questionsStatus[i]['sectionId'];
                page.done = runExamVm.questionsStatus[i]['done'];
                runExamVm.pages.viewFrame.push(page);
            }
        }

        runExamVm.addFinishPageToFrame(n);

        runExamVm.pages.next = (n < runExamVm.questionsStatus.length);
        runExamVm.pages.previous = (k > 0);
    };

    runExamVm.numberItemPerPage = 0;    //number question status item per page
    //identify number item per page when user change window size
    runExamVm.identifyNumberItemPerPage = function () {
        //all magic width in this function is identified by experience (manually)
        var width = runExamVm.myWindow.width();
        if(width > 1150) {
            runExamVm.numberItemPerPage = 22;
        } else if(width <= 1150 && width > 880) {
            runExamVm.numberItemPerPage = 16;
        } else if (width <= 880 && width > 526) {
            runExamVm.numberItemPerPage = 8;
        } else if (width <= 526 && width > 350) {
            runExamVm.numberItemPerPage = 4;
        } else {
            runExamVm.numberItemPerPage = 2;
        }
    };

    //get question index based on its order
    runExamVm.identifyPageItem = function (order) {
        if (runExamVm.questionsStatus == null) return null;

        var n = runExamVm.questionsStatus.length;
        for(var i=0; i < n; i++) {
            if (runExamVm.questionsStatus[i].order == order) {
                return i;
            }
        }

    };
    //</editor-fold>

    //<editor-fold desc="update single choice and multiple choice question">
    //user answer for single choice question by click on description
    runExamVm.selectRadio = function(sectionIdx, questionIdx, questionId, answerId) {
        if (runExamVm.examFinished) return;

        runExamVm.sections[sectionIdx].questions[questionIdx].selectedRadio = answerId;
        runExamVm.updateRadio(sectionIdx, questionIdx, questionId, answerId);
    };

    //user answer for single choice question by click on radio button
    runExamVm.updateRadio = function(sectionIdx, questionIdx, questionId, answerId) {
        if (runExamVm.examFinished) return;

        var order = runExamVm.sections[sectionIdx].questions[questionIdx].order;
        var pageItem = runExamVm.identifyPageItem(order);

        runExamVm.questionsStatus[pageItem]['done'] = true;

        //change current question to this question
        runExamVm.currentOrder = order;
        runExamVm.displayPagePagination();

        //change url
        $location.search('order', order).hash('_').replace();

        var runService = new RunService({examId: runExamVm.examId, questionId: questionId});
        runService['selectedId'] = answerId;
        runService['sectionIdx'] = sectionIdx;
        runService['questionIdx'] = questionIdx;

        runService.$updateAnswers(function successCallback(response){
            runExamVm.updateTryTime = 0;
        }, function errorCallback(response){
            console.log('error');
            console.log(response);

            runExamVm.statusMessage = 'Chưa cập nhật câu trả lời được. Đang gửi lại...';
            if (runExamVm.updateTryTime < runExamVm.maxTryTime) {
                runExamVm.updateTryTime++;
                $timeout(runExamVm.updateRadio, 10000, true,
                    runService.sectionIdx, runService.questionIdx, runService.questionId, runService.selectedId);
            }
        });
    };

    //user answer for multiple choice question by click on description
    runExamVm.selectCheckbox = function(sectionIdx, questionIdx, answerIdx) {
        if (runExamVm.examFinished) return;

        runExamVm.sections[sectionIdx].questions[questionIdx].answers[answerIdx].isSelected =
            (runExamVm.sections[sectionIdx].questions[questionIdx].answers[answerIdx].isSelected) ? 0 : 1;
        runExamVm.updateCheckbox(sectionIdx, questionIdx);
    };

    //user answer for multiple choice question by click on checkbox button
    runExamVm.updateCheckbox = function(sectionIdx, questionIdx) {
        var n = runExamVm.sections[sectionIdx].questions[questionIdx].answers.length;
        var questionId = runExamVm.sections[sectionIdx].questions[questionIdx].id;
        var selectedCheckbox = {};
        var answer;
        var order = runExamVm.sections[sectionIdx].questions[questionIdx].order;
        var pageItem = runExamVm.identifyPageItem(order);
        runExamVm.questionsStatus[pageItem]['done'] = false;
        for(var i=0; i < n; i++) {
            answer = runExamVm.sections[sectionIdx].questions[questionIdx].answers[i];
            selectedCheckbox[answer.id] = answer.isSelected;

            //update question status
            if (answer.isSelected) {
                runExamVm.questionsStatus[pageItem]['done'] = true;
            }
        }

        //change current question to this question
        runExamVm.currentOrder = order;
        runExamVm.displayPagePagination();

        //change url
        $location.search('order', order).hash('_').replace();

        var runService = new RunService({examId: runExamVm.examId, questionId: questionId});
        runService['checkedStatusArray'] = selectedCheckbox;
        runService['sectionIdx'] = sectionIdx;
        runService['questionIdx'] = questionIdx;

        runService.$updateAnswers(function successCallback(response){
            runExamVm.updateTryTime = 0;
        }, function errorCallback(response){
            console.log('error');
            console.log(response);

            runExamVm.statusMessage = 'Chưa cập nhật câu trả lời được. Đang gửi lại...';
            if (runExamVm.updateTryTime < runExamVm.maxTryTime) {
                runExamVm.updateTryTime++;
                $timeout(runExamVm.updateCheckbox, 10000, true,
                    runService.sectionIdx, runService.questionIdx);
            }
        });
    };
    //</editor-fold>

    //<editor-fold desc="count down mode">
    //extract some time value to display on progress bar
    runExamVm.calculateCountDown = function (remainTime) {
        runExamVm.currentSecond = remainTime % 60;
        runExamVm.currentMinute = (Math.floor(remainTime / 60)) % 60;
        runExamVm.currentHour = (Math.floor(remainTime / 3600));

        if (runExamVm.currentHour < 100) {
            runExamVm.digitalTimer = ('0' + runExamVm.currentHour).slice(-2) + ':' + ('0' + runExamVm.currentMinute).slice(-2)
                + ':' + ('0' + runExamVm.currentSecond).slice(-2);
        } else {
            runExamVm.digitalTimer = '> 99' + ':' + ('0' + runExamVm.currentMinute).slice(-2)
                + ':' + ('0' + runExamVm.currentSecond).slice(-2);
        }

        //decrease hour for display by progress bar
        runExamVm.currentHour = runExamVm.currentHour > 24 ? 24 : runExamVm.currentHour;
    };

    runExamVm.myCountDown = null;   //timer promise is used for cancel later
    runExamVm.localRemainTime = 0;
    runExamVm.runCountDown = function () {
        // var now = moment().tz(runExamVm.timeZone);
        // var beginToNow = now.diff(runExamVm.examBeginTime, 'seconds');

        var now = moment();
        var startToNow = now.diff(runExamVm.startPoint, 'seconds');

        // runExamVm.remainTime = runExamVm.duration - beginToNow;
        runExamVm.localRemainTime = runExamVm.remainTime - startToNow;

        if (runExamVm.localRemainTime > 0) {
            if (runExamVm.countDownMode != 0) {
                runExamVm.calculateCountDown(runExamVm.localRemainTime);
            }
            runExamVm.myCountDown = $timeout(runExamVm.runCountDown,1000);
        } else {
            runExamVm.localRemainTime = 0; //make sure is set to 0
            runExamVm.calculateCountDown(runExamVm.localRemainTime);

            runExamVm.displayFinishPage = false;
            runExamVm.finishExam();
        }
    };

    //stop count down
    runExamVm.stopCountDown = function () {
        $timeout.cancel(runExamVm.myCountDown);
    };

    //user click on count down area to change count down display mode
    runExamVm.changeCountDownMode = function () {
        switch (runExamVm.countDownMode) {
            case 0:
                runExamVm.countDownMode = 1; //display count down (full mode): progress and timer
                break;
            case 1:
                runExamVm.countDownMode = 2; //display count down with timer
                break;
            case 2:
                runExamVm.countDownMode = 3; //display count down with progress
                break;
            default:
                runExamVm.countDownMode = 0; //non-display
                break;
        }
    };
    //</editor-fold>

    //<editor-fold desc="change window size">
    runExamVm.isFullScreen = false;
    runExamVm.goFullScreen = function () {
        if (Fullscreen.isEnabled()) {
            Fullscreen.cancel();
            runExamVm.isFullScreen = false;
        }
        else {
            Fullscreen.all();
            runExamVm.isFullScreen = true;
        }

    };

    //detect window size change and update question list and draw matching link
    runExamVm.myWindow = angular.element($window);
    runExamVm.myWindow.on('resize', function() {
        runExamVm.displayPagePagination();

        $timeout(function() {
            runExamVm.reDrawAllConnect(); //redraw all connect of answer match
        });

        // don't forget manually trigger $digest()
        $scope.$digest();
    });

    //</editor-fold>

    //<editor-fold desc="essay answer">
    var customToolbar = "fontselect | fontsizeselect | forecolor backcolor |" +
        " alignleft aligncenter alignright alignjustify |" +
        " bullist numlist indent outdent | image media | code | mathtype";

    runExamVm.questionEditing = false;  //flag to know question is editing or not
    //tinymce editor settings
    runExamVm.editorSettings = {
        language_url : '/js/tinymce-v451/langs/vi.js',
        external_plugins: {
            'advlist': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/advlist/plugin.min.js',
            'link': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/link/plugin.min.js',
            'image': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/image/plugin.min.js',
            'imagetools': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/imagetools/plugin.min.js',
            'lists': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/lists/plugin.min.js',
            'charmap': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/charmap/plugin.min.js',
            'hr': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/hr/plugin.min.js',
            'searchreplace': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/searchreplace/plugin.min.js',
            'media': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/media/plugin.min.js',
            'table': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/table/plugin.min.js',
            'contextmenu': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/contextmenu/plugin.min.js',
            'paste': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/paste/plugin.min.js',
            'textcolor': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/textcolor/plugin.min.js',
            'colorpicker': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/colorpicker/plugin.min.js',
            'code': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/code/plugin.min.js'
        },
        themes: "inlite",
        inline: true,
        trusted: true, // all TinyMCE content that is set to ngModel will be whitelisted by $sce
        theme: "modern",
        language: 'vi',
        plugins: [
            "advlist link image imagetools lists charmap hr",
            "searchreplace media",
            "table contextmenu paste textcolor colorpicker code"
        ], //don't use code plugin, because MathJax script will modified
        contextmenu: "cut copy paste | link image inserttable | cell row column deletetable",
        menu: {
            edit: {title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall | searchreplace'},
            insert: {title: 'Insert', items: 'image media link | charmap hr template | mathtype'},
            format: {title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat'},
            table: {title: 'Table', items: 'inserttable tableprops deletetable | cell row column'},
            tools: {title: 'Tools', items: 'code'},
            help: {title: 'Help', items: 'editorhelp mathtypehelp'}
        },
        menubar: "edit insert format table tools help",
        toolbar: customToolbar,
        table_default_styles: {
            width: '100%'
        },
        statusbar: false,
        fontsize_formats: '8pt 10pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 32pt 36pt 48pt 72pt',
        custom_undo_redo_levels: 10,
        image_advtab: true,
        relative_urls: false,
        remove_script_host: false,
        convert_urls : true,
        //paste_retain_style_properties: "color font-weight text-align text-decoration border background float display",
        content_css: ["/css/bootstrap.min.css?" + new Date().getTime()], //add some attribute
        entity_encoding: 'raw', //for optimize speed
        //height: 350,
        extended_valid_elements: '*[*]', //allow because of inserting math equation with block div (when insert, it auto delete all previous script)
        setup: function(editor) {
            editor.addMenuItem('editorhelp', {
                text: 'Editor guide',
                context: 'help',
                onclick: function() {
                    editor.windowManager.open({
                        title: 'Hướng dẫn soạn thảo',
                        url: '/guide/editor?tinymce=1',
                        width: 800,
                        height: 570
                    });
                }
            });
            editor.addMenuItem('mathtypehelp', {
                text: 'Mathtype guide',
                context: 'help',
                onclick: function() {
                    editor.windowManager.open({
                        title: 'Hướng dẫn gõ công thức',
                        url: '/guide/mathtype?tinymce=1',
                        width: 800,
                        height: 570
                    });
                }
            });

            function loadMathType() {
                editor.windowManager.open({
                    title: 'Công thức',
                    url: '/u/mathtype',
                    width: 700, //no bigger because windows not change when browser change size, or if screen is smaller, can not scroll to see
                    height: 600
                }, {
                    oninsert: function (equation, blockDisplay) {
                        //detailVm.initTinyMceWithNoChange = false; //user interacted with editor. if user init tinymce and add new image, it must be saved.

                        //make sure that math equation in template
                        var formattedEquation;
                        //&#8203; -> zero-width space can not be used because when undo/redo tinymce auto delete
                        if (blockDisplay) {
                            formattedEquation = '<div class="math">' +
                                    //'<span>&#8203;</span>' +
                                '$$' + equation + '$$' +
                                    //'<span class="scriptMath" style="display:none">' +
                                    //'$$' + equation + '$$' +
                                    //'</span>' +
                                '</div>' + '<p></p>';
                        } else {
                            //zero-width non-joined placed in math element and previous equation
                            //this make image when drag into before math element and drag next, equation will did not disappear
                            formattedEquation =
                                '&nbsp;' +         //prevent delete equation when delete before character
                                '\\(' + equation + '\\)' +
                                '&#8204;&nbsp;';
                            //zero-width non-joined placed in last and out math element,
                            //this make user can not go into equation and type continue
                        }

                        editor.insertContent(formattedEquation, null);
                        MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id]); //refresh MathJax
                    }
                });
            }

            editor.addMenuItem('mathtype', {
                text: 'Công thức',
                context: 'insert',
                icon: 'sigma',
                onclick: function() {
                    loadMathType();
                }
            });

            editor.addButton("mathtype", {
                text: 'Công thức',
                //title: "",
                tooltip: "Gõ công thức toán, hóa học",
                icon: false,
                onclick: function() {
                    loadMathType();
                }
            });

            editor.on('init', function() {
                runExamVm.essayEditor = editor;
                editor.selectedMathId = null;
                editor.selectedMathDisplay = false; //true is display block
                editor.moveNext = true;
                editor.pressSpace = false;
                editor.beginInlineMath = false;
                editor.endInlineMath = false;
                editor.runMathJax = false;

                //refresh when init math (use in the case user move to other place)
                $('#' + editor.id).find('.scriptMath').each(function(){
                    var scriptMath = $(this).html();
                    $(this).before(scriptMath);
                });
                MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id]);
            });

            editor.on('change', function() {
                if (editor.endInlineMath) {
                    editor.endInlineMath = false; //must before insert space (execCommand)
                    editor.runMathJax = true;
                    editor.execCommand('mceInsertContent', false, "&zwnj;"); //will call change event again
                } else if (editor.runMathJax) {
                    editor.runMathJax = false;
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id]);
                }
            });

            editor.on('click', function(e) {
                //math equation in template is same as mathtype plugin

                runExamVm.questionEditing = true;
                var currentElm = $(e.target);

                //check if node is clicked is mathjax SVG, create editing math element
                var mathJaxNode = currentElm.closest('.MathJax_SVG');

                if (mathJaxNode.length > 0) {
                    //if user is staying the equation, after that go into other equation,
                    //we convert the equation to SVG before edit new selected equation
                    if (editor.selectedMathId != null && mathJaxNode.attr('id') != editor.selectedMathId)
                    {
                        var editMathElm = $('.editMath'); //find edit math element
                        if (editMathElm.length > 0) {
                            var text = editMathElm.html();
                            //editMathElm.next('script').html(text);

                            if (editor.selectedMathDisplay) {
                                var blockElm2 = editMathElm.closest('.MathJax_SVG_Display');
                                blockElm2.replaceWith('$$' + text + '$$');
                            } else {
                                editMathElm.replaceWith('\\(' + text + '\\)');
                            }
                            MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id], function() {
                                //callback function is called after convert previous math element
                                //It create editing math element
                                editor.selectedMathId = mathJaxNode.attr('id');

                                //get raw equation and remove script tag of MathJax
                                var scriptElm, originalText;

                                var blockElm = currentElm.closest('.MathJax_SVG_Display');
                                if (blockElm.length > 0) {
                                    //if equation is block display, it have div outside to make style center align
                                    //so go up one level to get script element
                                    scriptElm = blockElm.next('script');
                                } else {
                                    scriptElm = mathJaxNode.next('script');
                                }
                                originalText = scriptElm.html();
                                editor.selectedMathDisplay = (scriptElm.attr('type').indexOf('mode=display') > -1);
                                scriptElm.remove();

                                //insert editing math element
                                mathJaxNode.after('<span class="editMath" id="editMath_' + editor.selectedMathId + '" style="border: 1px solid red; padding: 2px 2px;">' + originalText + '</span>');
                                mathJaxNode.remove();
                            });
                        }
                    } else {
                        //create editing math element
                        editor.selectedMathId = mathJaxNode.attr('id');

                        //get raw equation and remove script tag of MathJax
                        var scriptElm, originalText;

                        var blockElm = currentElm.closest('.MathJax_SVG_Display');
                        if (blockElm.length > 0) {
                            //if equation is block display, it have div outside to make style center align
                            //so go up one level to get script element
                            scriptElm = blockElm.next('script');
                        } else {
                            scriptElm = mathJaxNode.next('script');
                        }
                        originalText = scriptElm.html();
                        editor.selectedMathDisplay = (scriptElm.attr('type').indexOf('mode=display') > -1);
                        scriptElm.remove();

                        //insert editing math element
                        mathJaxNode.after('<span class="editMath" id="editMath_' + editor.selectedMathId + '" style="border: 1px solid red; padding: 2px 2px;">' + originalText + '</span>');
                        mathJaxNode.remove();
                    }

                }
                //else {
                //    //Node change event detect if user clic out of editting math
                //    //so don't need do any thing here
                //}
            });

            editor.on('blur', function(){
                runExamVm.questionEditing = false;
                //Khong duoc chinh sua math o day vi khi click vao math no vua thuc hien lost focus (blur) vua focus
            });

            editor.on('NodeChange', function(e){
                var currentElm = $(e.element);

                //move image out of math element if it is being inside when user drag and drop image
                var mathElm = currentElm.closest('.MathJax_SVG_Display'); //block display math
                if (mathElm.length == 0) {
                    mathElm = currentElm.closest('.MathJax_SVG'); //inline display math
                }
                if (mathElm.length > 0) {
                    var imgNode = mathElm.find('img');
                    if (imgNode.length > 0) {
                        imgNode.remove();
                        mathElm.before(imgNode);
                        mathElm.before('&zwnj;');
                    }
                }

                var editingMathElm = currentElm.closest('.editMath');
                if (editingMathElm.length == 0 && editor.selectedMathId != null) {
                    //if current element is not editing math element and previous selected is editing math element,
                    //make previous to math display
                    //In other word, when node change and is not editing math node,
                    //if previous node is math, add symbol to equation. After that, MathJax will convert it to SVG
                    var editMathElm = $('.editMath'); //get all editing math node if any
                    if (editMathElm.length > 0) {
                        editor.selectedMathId = null; //clear selected math node

                        var text = editMathElm.html();
                        if (editor.selectedMathDisplay) {
                            var blockElm = editMathElm.closest('.MathJax_SVG_Display');

                            blockElm.replaceWith('$$' + text + '$$'); //add special symbol
                        } else {
                            editMathElm.replaceWith('\\(' + text + '\\)'); //add special symbol
                        }
                        MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id]); //refresh MathJax
                    }
                }

                if (mathElm.length > 0 && editingMathElm.length == 0) {
                    //if caret in math area and status is not editing,
                    //move caret out equation
                    var range, sel = rangy.getSelection();
                    range = rangy.createRange();
                    var mathNodeHtml;
                    if (editor.moveNext == true) {
                        mathNodeHtml = mathElm[0].nextSibling.nextSibling; //over script tag
                        //console.log(mathNodeHtml);
                        if (mathNodeHtml == null) {
                            mathNodeHtml = mathElm[0].parentNode.nextSibling.firstChild;
                        }
                        //if it is not text node, find first text node in childs
                        if (mathNodeHtml.nodeType != Node.TEXT_NODE) {
                            var childNodes = mathNodeHtml.childNodes;
                            for(var i = 0; i < childNodes.length; i++) {
                                var child = childNodes[i];
                                if (child.nodeType == 3) {
                                    mathNodeHtml = child;
                                    break;
                                }
                            }
                        }
                        //if equation is inline, move over non-width space which put at the following.
                        var moveOverNonWidthSpace = 0;
                        if (mathNodeHtml.nodeType == Node.TEXT_NODE
                            && mathNodeHtml.wholeText.charCodeAt(0) === 8204) {
                            moveOverNonWidthSpace = 1;
                        }
                        range.setStart(mathNodeHtml, moveOverNonWidthSpace);
                        range.setEnd(mathNodeHtml, moveOverNonWidthSpace);
                    } else {
                        mathNodeHtml = mathElm[0].previousSibling;
                        if (mathNodeHtml == null) {
                            mathNodeHtml = mathElm[0].parentNode.previousSibling.lastChild;
                        }
                        //if it is not text node, find last text node in childs
                        if (mathNodeHtml.nodeType != Node.TEXT_NODE) {
                            for(var nodes = mathNodeHtml.childNodes, j = nodes.length; j--;) {
                                var node = nodes[j];
                                if (node.nodeType == 3) {
                                    mathNodeHtml = node;
                                    break;
                                }
                            }
                        }
                        range.setStart(mathNodeHtml, mathNodeHtml.length);
                        range.setEnd(mathNodeHtml, mathNodeHtml.length);
                    }
                    //apply this range to the selection object
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            });

            editor.on('KeyDown', function(e) {
                if (e.key != "Tab" && runExamVm.examFinished) {
                    e.preventDefault();
                    return;
                }

                editor.moveNext = (e.key == "ArrowRight" || e.key == "Right"); //move next. Otherwise, move previous
                editor.endInlineMath = (e.key == ')'); //add zwnj; after ) for inline math on change event
                editor.runMathJax = (e.key == ']') || (e.key == '$'); //process Mathjax when key press is ] or $. For ), use endInlineMath

                //check length limit
                var control_keys = ['Backspace', 'Enter', 'Shift', 'Control', 'Alt', 'CapsLock', 'PageUp', 'PageDown',
                    'End', 'Home', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Delete', 'Left', 'Up', 'Right', 'Down', 'Del'];
                if(control_keys.indexOf(e.key) == -1){
                    //detailVm.initTinyMceWithNoChange = false; //user interacted with editor

                    var chars_with_html = editor.getContent().length;

                    if (runExamVm.checkLengthOverLimit(chars_with_html)) {
                        editor.stopPropagation();
                        editor.preventDefault();
                        return false;
                    }
                }

                //insert space before backslash
                //must after check length limit
                if (e.key == '\\'  && !editor.pressSpace) { // is \
                    editor.execCommand('mceInsertContent', false, " \\"); //will call change event again
                    editor.preventDefault();
                    editor.stopPropagation();
                    editor.pressSpace = true; //if press more than one backslash, not insert space before
                    return false;
                }

                //flag for insert space before begin math equation if any in the next time
                editor.pressSpace = (e.key == ' ' || e.key == '\\');
            });
        }
    };

    //check user paste or type content over limit length
    runExamVm.checkLengthOverLimit = function (chars_with_html) {
        //limit of column in mySQL 65536 ~ 21844 chars in UTF-8
        //because editor include html tag, ..., so for safe, use it for 20000 chars
        var max_length = 20000;

        if (chars_with_html > max_length){
            runExamVm.statusMessage = 'Chiều dài vượt giới hạn!';
            return true;
        } else {
            runExamVm.statusMessage = '';
            return false;
        }
    };

    //update essay (description for essay type)
    runExamVm.updateEssay = function (sectionIdx, questionIdx, questionId, essay) {
        if (runExamVm.examFinished) return;

        //clear mathjax compiled script
        var descriptionElm = $('<div />').append(essay);
        descriptionElm.find('script').replaceWith(function(){
            var scriptMath = $(this).html().replace("// <![CDATA[", "").replace("// ]]>", "").trim();
            var blockDisplay = $(this).attr('type');
            if (typeof blockDisplay !== "undefined" && blockDisplay=="math/tex; mode=display") {
                scriptMath = '$$' + scriptMath + '$$';
            } else {
                scriptMath = '\\(' + scriptMath + '\\)&amp; zwnj;'; //inline
            }
            return scriptMath;
        });
        descriptionElm.find('.MathJax_SVG_Display, .MathJax_SVG, .editMath').remove();
        var description = descriptionElm.html();
        description = description.replace(/&amp; zwnj;/g,"&zwnj;"); //preserve zero-width non joiner
        description = description.replace(/[\n\t]+/g,""); //remove all newline

        if (runExamVm.checkLengthOverLimit(description)) {
            return ;
        }

        var questionOrder = runExamVm.sections[sectionIdx].questions[questionIdx].order;
        var pageItem = runExamVm.identifyPageItem(questionOrder);

        if (!runExamVm.questionsStatus[pageItem]['done']) {
            runExamVm.questionsStatus[pageItem]['done'] = true;
        }

        var runService = new RunService({examId: runExamVm.examId, questionId: questionId});
        runService['essay'] = description;
        runService['sectionIdx'] = sectionIdx;
        runService['questionIdx'] = questionIdx;

        runService.$updateAnswers(function successCallback(response){
            runExamVm.updateTryTime = 0;
        }, function errorCallback(response){
            console.log('error');
            console.log(response);

            runExamVm.statusMessage = 'Chưa cập nhật câu trả lời được. Đang gửi lại...';
            if (runExamVm.updateTryTime < runExamVm.maxTryTime) {
                runExamVm.updateTryTime++;
                $timeout(runExamVm.updateEssay, 10000, true,
                    runService.sectionIdx, runService.questionIdx, runService.questionId, runService.essay);
            }
        });

    };
    //</editor-fold>

    //<editor-fold desc="matching answer">
    //reset selection in matching type question
    runExamVm.resetSelectedMatch = function () {
        runExamVm.selectedQuestion = -1;
        runExamVm.selectedAnswer = -1;
        runExamVm.selectedQuestionMatch = -1;
        runExamVm.selectedMatch = -1;
    };

    //select answer box
    runExamVm.selectAnswer = function(sectionIdx, questionIdx, order, $event) {
        //matching type
        if (runExamVm.examFinished) return;

        runExamVm.selectedQuestion = runExamVm.sections[sectionIdx].questions[questionIdx].id;
        runExamVm.selectedAnswer = order;
        if ($event != null) $event.stopPropagation();

        if (runExamVm.processedMatchedPair || runExamVm.selectedQuestion != runExamVm.selectedQuestionMatch) {
            //click new one after paring
            runExamVm.selectedQuestionMatch = -1;
            runExamVm.selectedMatch = -1;
            runExamVm.processedMatchedPair = false;
        } else {
            runExamVm.paringMatch(sectionIdx, questionIdx,
                runExamVm.selectedQuestion, runExamVm.selectedQuestionMatch,
                runExamVm.selectedAnswer,runExamVm.selectedMatch);
        }

        //change current question to this question
        var questionOrder = runExamVm.sections[sectionIdx].questions[questionIdx].order;
        runExamVm.currentOrder = questionOrder;
        runExamVm.displayPagePagination();

        //change url
        $location.search('order', questionOrder).hash('_').replace();

    };

    //select match box
    runExamVm.selectMatch = function(sectionIdx, questionIdx, id, $event) {
        //matching type
        if (runExamVm.examFinished) return;

        runExamVm.selectedQuestionMatch = runExamVm.sections[sectionIdx].questions[questionIdx].id;
        runExamVm.selectedMatch = id;
        if ($event != null) $event.stopPropagation();

        if (runExamVm.processedMatchedPair || runExamVm.selectedQuestion != runExamVm.selectedQuestionMatch) {
            //click new one after paring
            runExamVm.selectedQuestion = -1;
            runExamVm.selectedAnswer = -1;
            runExamVm.processedMatchedPair = false;
        } else {
            runExamVm.paringMatch(sectionIdx, questionIdx,
                runExamVm.selectedQuestion, runExamVm.selectedQuestionMatch,
                runExamVm.selectedAnswer,runExamVm.selectedMatch);
        }


        //change current question to this question
        var questionOrder = runExamVm.sections[sectionIdx].questions[questionIdx].order;
        runExamVm.currentOrder = questionOrder;
        runExamVm.displayPagePagination();

        //change url
        $location.search('order', questionOrder).hash('_').replace();
    };

    runExamVm.processedMatchedPair = false; //flag to know current pair is processed or not
    runExamVm.paringMatch = function (sectionIdx, questionIdx, selectedQuestion, selectedQuestionMatch, selectedAnswer, selectedMatch) {
        if (selectedAnswer != -1 &&  selectedMatch != -1
            && selectedQuestion == selectedQuestionMatch) {

            var questionOrder = runExamVm.sections[sectionIdx].questions[questionIdx].order;
            var pageItem = runExamVm.identifyPageItem(questionOrder);

            runExamVm.questionsStatus[pageItem]['done'] = true;

            var questionId = runExamVm.sections[sectionIdx].questions[questionIdx].id;
            var matchedPairArray = {};
            var n = runExamVm.sections[sectionIdx].questions[questionIdx].answers.length;
            var order, matchId;

            for(var i=0; i < n; i++) {
                //create new link
                order = runExamVm.sections[sectionIdx].questions[questionIdx].answers[i].order;
                if (order == selectedAnswer) {
                    runExamVm.sections[sectionIdx].questions[questionIdx].answers[i].matchId = selectedMatch;
                } else {
                    //unlink old pair
                    matchId = runExamVm.sections[sectionIdx].questions[questionIdx].answers[i].matchId;
                    if (matchId == selectedMatch) {
                        runExamVm.sections[sectionIdx].questions[questionIdx].answers[i].matchId = 0;
                    }
                }

                matchedPairArray[order] = runExamVm.sections[sectionIdx].questions[questionIdx].answers[i].matchId;
            }

            runExamVm.processedMatchedPair = true;
            runExamVm.drawConnect(sectionIdx, questionIdx);

            var runService = new RunService({examId: runExamVm.examId, questionId: questionId});
            runService['matchedPairArray'] = matchedPairArray;
            runService['sectionIdx'] = sectionIdx;
            runService['questionIdx'] = questionIdx;
            runService['selectedQuestion'] = selectedQuestion;
            runService['selectedQuestionMatch'] = selectedQuestionMatch;
            runService['selectedAnswer'] = selectedAnswer;
            runService['selectedMatch'] = selectedMatch;

            runService.$updateAnswers(function successCallback(response){
                runExamVm.updateTryTime = 0;
            }, function errorCallback(response){
                console.log('error');
                console.log(response);
                runExamVm.statusMessage = 'Chưa cập nhật câu trả lời được. Đang gửi lại...';
                if (runExamVm.updateTryTime < runExamVm.maxTryTime) {
                    runExamVm.updateTryTime++;
                    $timeout(runExamVm.paringMatch, 10000, true,
                        runService.sectionIdx, runService.questionIdx,
                        runService.selectedQuestion, runService.selectedQuestionMatch,
                        runService.selectedAnswer, runService.selectedMatch
                    );
                }
            });
        }
    };

    //draw connect for paired matching
    runExamVm.drawConnect = function(sectionIdx, questionIdx) {
        if (runExamVm.finishPage) return;

        var question = runExamVm.sections[sectionIdx].questions[questionIdx];
        if (question.type != 3) return;

        var questionId = question.id;

        var matchId, answerElm, matchElm, line1Elm, line2Elm, line3Elm, beginX, beginY, endX, endY;
        var i, order;
        var n = question.answers.length;
        for(i=0; i < n; i++) {
            order = question.answers[i].order;
            matchId = question.answers[i].matchId;

            //get answer box element and line element
            answerElm = angular.element(document.querySelector( '#answer-' + questionId + '-' + order));
            line1Elm = angular.element(document.querySelector( '#line1-' + questionId + '-' + order));
            line2Elm = angular.element(document.querySelector( '#line2-' + questionId + '-' + order));
            line3Elm = angular.element(document.querySelector( '#line3-' + questionId + '-' + order));

            if (matchId != 0) {
                //get match box element
                matchElm = angular.element(document.querySelector( '#match-' + questionId + '-' + matchId));

                //calculate the coordinates
                beginX = answerElm.position().left + answerElm.outerWidth();
                beginY = answerElm.position().top + answerElm.outerHeight()/2;

                endX = matchElm.position().left;
                endY = matchElm.position().top + matchElm.outerHeight()/2;

                //draw
                line1Elm.attr('x1', beginX); line1Elm.attr('y1', beginY);
                line1Elm.attr('x2', beginX + 10); line1Elm.attr('y2', beginY);

                line2Elm.attr('x1', beginX + 10); line2Elm.attr('y1', beginY);
                line2Elm.attr('x2', endX - 10); line2Elm.attr('y2', endY);

                line3Elm.attr('x1', endX - 10); line3Elm.attr('y1', endY);
                line3Elm.attr('x2', endX); line3Elm.attr('y2', endY);
            } else {
                //clear link if have
                line1Elm.attr('x1', 0); line1Elm.attr('y1', 0); line1Elm.attr('x2', 0); line1Elm.attr('y2', 0);
                line2Elm.attr('x1',0); line2Elm.attr('y1', 0); line2Elm.attr('x2', 0); line2Elm.attr('y2', 0);
                line3Elm.attr('x1', 0); line3Elm.attr('y1', 0); line3Elm.attr('x2', 0); line3Elm.attr('y2', 0);
            }
        }

        //draw line which is answer key (correct line)
        if (runExamVm.showAnswerKey) {
            for(i=0; i < n; i++) {
                var answer = question.answers[i];
                if (!answer.isRight) {
                    answerElm = angular.element(document.querySelector( '#answer-' + questionId + '-' + answer.order));
                    matchElm = angular.element(document.querySelector( '#match-' + questionId + '-' + answer.correctId));

                    line1Elm = angular.element(document.querySelector( '#line1c-' + questionId + '-' + answer.order));
                    line2Elm = angular.element(document.querySelector( '#line2c-' + questionId + '-' + answer.order));
                    line3Elm = angular.element(document.querySelector( '#line3c-' + questionId + '-' + answer.order));

                    beginX = answerElm.position().left + answerElm.outerWidth();
                    beginY = answerElm.position().top + answerElm.outerHeight()/2 + 5;

                    endX = matchElm.position().left;
                    endY = matchElm.position().top + matchElm.outerHeight()/2 + 5;

                    line1Elm.attr('x1', beginX);
                    line1Elm.attr('y1', beginY);
                    line1Elm.attr('x2', beginX + 10);
                    line1Elm.attr('y2', beginY);

                    line2Elm.attr('x1', beginX + 10);
                    line2Elm.attr('y1', beginY);
                    line2Elm.attr('x2', endX - 10);
                    line2Elm.attr('y2', endY);

                    line3Elm.attr('x1', endX - 10);
                    line3Elm.attr('y1', endY);
                    line3Elm.attr('x2', endX);
                    line3Elm.attr('y2', endY);
                }
            }
        }

    };

    runExamVm.reDrawAllConnect = function () {
        var nSection, nQuestion, question;
        nSection = runExamVm.sections.length;
        for (var i = 0; i < nSection; i++) {
            nQuestion = runExamVm.sections[i].questions.length;
            for (var j=0; j < nQuestion; j++) {
                question = runExamVm.sections[i].questions[j];
                if (question.type == 3) {
                    //matching type
                    runExamVm.drawConnect(i, j);
                }
            }
        }
    };
    //</editor-fold>

    //<editor-fold desc="Doing help">
    runExamVm.checkHelps = function () {
        runExamVm.isHelpReduceSelection = (!runExamVm.examFinished
        && runExamVm.reduceSelectionCost >= 0
        && (runExamVm.userIsCreator || runExamVm.reduceSelectionCost <= runExamVm.coin)
        && runExamVm.remainReduceSelection > 0);
    };

    runExamVm.doingHelp = false;
    runExamVm.hidingExam = false;
    runExamVm.helpingType = -1;
    runExamVm.doHelp = function (helpType, available, cost) {
        if (runExamVm.loadingExam || runExamVm.closing) return;

        if (runExamVm.doingHelp) {
            runExamVm.statusMessage = 'Đang xử lý hỗ trợ khác, vui lòng đợi...';
            return;
        }

        if (available) {
            //do if help is enable

            //get sectionIdx and questionIdx
            var questionOrder = runExamVm.currentOrder;
            var pageItem = runExamVm.identifyPageItem(questionOrder);
            var questionId = runExamVm.questionsStatus[pageItem].id;
            var sectionId = runExamVm.questionsStatus[pageItem].sectionId;
            var nSection, nQuestion;
            var sectionIdx = -1, questionIdx = -1;
            nSection = runExamVm.sections.length;
            for (var i=0; i < nSection; i++) {
                if (runExamVm.sections[i].id == sectionId) {
                    sectionIdx = i;
                    nQuestion = runExamVm.sections[i].questions.length;
                    for (var j=0; j < nQuestion; j++) {
                        if (runExamVm.sections[i].questions[j].id == questionId) {
                            questionIdx = j;
                            break;
                        }
                    }
                    break;
                }
            }

            if (sectionIdx != -1 && questionIdx != -1 && runExamVm.sections[sectionIdx].questions[questionIdx] == 2) {
                //essay type
                runExamVm.statusMessage = 'Loại câu hỏi của ' + questionOrder + ' không được hỗ trợ...';

                $timeout(function(){
                    runExamVm.statusMessage = '';
                }, 5000);

                return;
            }

            if (runExamVm.localRemainTime <= 5) {
                runExamVm.statusMessage = 'Thời gian còn lại quá ít để thực hiện hỗ trợ này';

                $timeout(function(){
                    runExamVm.statusMessage = '';
                }, 5000);

                return;
            }

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'reduceSelectionModal.html',
                controller: 'reduceSelectionCtrl',
                controllerAs: 'reduceSelectionVm',
                keyboard: true,
                size: null,
                resolve: {
                    questionOrder: function () {
                        return runExamVm.currentOrder;
                    },
                    cost: function () {
                        return runExamVm.reduceSelectionCost;
                    }
                }

            });

            modalInstance.result.then(function (confirm){
                if (confirm == true) {
                    runExamVm.doingHelp = true;
                    runExamVm.statusMessage = 'Đang xử lý hỗ trợ...';
                    var myHelpQuestion = RunService.helpQuestion({examId: runExamVm.examId, questionId: questionId, type: helpType},
                        function successCallback(response){
                            console.log(response);
                            runExamVm.statusMessage = '';
                            if (response.success) {
                                if (angular.isDefined(response.coin)) {
                                    runExamVm.coin = response.coin * 1; //remove 0 padding if have
                                }

                                //if (runExamVm.questionId != response.questionId) return;

                                runExamVm.remainReduceSelection = response.remainReduceSelection;
                                runExamVm.helpReduceSelection(response.questionId, response.reducedAnswers);
                                runExamVm.checkHelps();
                            } else {
                                runExamVm.statusMessage = response.message;

                                $timeout(function(){
                                    runExamVm.statusMessage = '';
                                }, 5000);
                            }
                            runExamVm.doingHelp = false;
                        }, function errorCallback(response){
                            runExamVm.doingHelp = false;
                            runExamVm.statusMessage = '';

                            console.log('error');
                            console.log(response);
                        });

                    if (runExamVm.myCancelableRequests.length >= 500) {
                        runExamVm.myCancelableRequests.shift();
                    }
                    runExamVm.myCancelableRequests.push(myHelpQuestion);
                }
            });
        } else {
            //display message to inform why is not available
            if (cost >= 0 && runExamVm.coin <= cost && runExamVm.localRemainTime > 0) {
                runExamVm.statusMessage = 'Không đủ xu để thực hiện';

                $timeout(function(){
                    runExamVm.statusMessage = '';
                }, 5000);
            }
        }
    };

    //do help reduce selection
    runExamVm.helpReduceSelection = function (questionId, reducedAnswers) {
        var i, nSection, nQuestion;
        var sectionIdx = -1, questionIdx = -1;
        nSection = runExamVm.sections.length;
        for (i=0; i < nSection; i++) {
            sectionIdx = i;
            nQuestion = runExamVm.sections[i].questions.length;
            for (var j=0; j < nQuestion; j++) {
                if (runExamVm.sections[i].questions[j].id == questionId) {
                    questionIdx = j;
                    break;
                }
            }

            if (questionIdx != -1) {
                break;
            }
        }

        if (sectionIdx == -1 || questionIdx == -1) {
            return;
        }

        var question = runExamVm.sections[sectionIdx].questions[questionIdx];
        switch (question.type) {
            case 0: //single choice
            case 1: //multiple choice
                //data must be array
                if (reducedAnswers.length == 0) {
                    return;
                }
                var nAnswer = question.answers.length;
                for(i= nAnswer - 1; i >= 0; i--) { //must in reserve order because splice function change index
                    var answer = question.answers[i];
                    if (reducedAnswers.indexOf(answer.id) !== -1) {
                        runExamVm.sections[sectionIdx].questions[questionIdx].answers.splice(i, 1);
                    }
                }

                //reset select
                if (question.type == 0) {
                    //single choice
                    runExamVm.sections[sectionIdx].questions[questionIdx].selectedRadio = -1;
                } else {
                    //multiple choice
                    nAnswer = runExamVm.sections[sectionIdx].questions[questionIdx].answers.length;
                    for(i=0; i < nAnswer; i++) {
                        runExamVm.sections[sectionIdx].questions[questionIdx].answers[i].isSelected = false;
                    }
                }

                break;
            case 2: //essay
                break;
            case 3: //matching
                //runExamVm.matchedPairArray = reducedAnswers; //array order and match-id

                var n = runExamVm.sections[sectionIdx].questions[questionIdx].answers.length;
                var order;

                for(i=0; i < n; i++) {
                    //create new link
                    order = runExamVm.sections[sectionIdx].questions[questionIdx].answers[i].order;
                    runExamVm.sections[sectionIdx].questions[questionIdx].answers[i].matchId = reducedAnswers[order];
                }

                break;
        }

        $timeout(function() {
            runExamVm.reDrawAllConnect(); //redraw all connect of answer match
        });
    };
    //</editor-fold>

    //make question is active when user choose it or answer it
    runExamVm.activeQuestion = function (order) {
        if (order < 1 || order > runExamVm.numberQuestion) {
            return;
        }

        runExamVm.currentOrder = order;
        runExamVm.displayPagePagination();

        //change url
        $location.search('order', order).hash('_').replace();
    };

    runExamVm.medalLevel = 0;   //user's medal in exam result after finish exam
    runExamVm.score = '';   //user's score
    runExamVm.examResult = null;    //exam result
    runExamVm.finishExam = function () {
        if (runExamVm.examFinished && runExamVm.examResult != null && runExamVm.displayFinishPage) {
            //loaded before
            runExamVm.loadingExam = false;
            // runExamVm.finishPage = true;
            runExamVm.showFinishPage();
            return;
        }

        var runService = new RunService({examId : runExamVm.examId});
        if (!runExamVm.showAnswerKey) {
            runService['encryptKey'] = runExamVm.encryptKey;
            runService['iv'] = runExamVm.iv;
        }

        runService.$finishExam(function successCallback(response) {
            if (response.success) {
                runExamVm.loadingExam = false;

                runExamVm.examFinished = true;
                runExamVm.calculateCountDown(0);
                runExamVm.stopCountDown();
                runExamVm.countDownMode = 3; //non-display

                runExamVm.checkHelps();

                runExamVm.examResult = response.examResult;

                //decrypt answer key if user want to know later
                runExamVm.showAnswerKey = response.examResult.showAnswerKey;
                runExamVm.encryptKey = response.examResult.encryptKey;
                runExamVm.iv = response.examResult.iv;
                if (runExamVm.showAnswerKey) {
                    runExamVm.decryptAnswerKey();
                }

                if (runExamVm.displayFinishPage) {
                    runExamVm.showFinishPage();
                }
            }
        }, function errorCallback(response){
            console.log('error');
            console.log(response);

            runExamVm.prepareResultChart(runExamVm.examResult);
        });
    };

    runExamVm.showFinishPage = function () {
        runExamVm.currentOrder = runExamVm.finishOrder;
        runExamVm.finishPage = true;
        runExamVm.prepareResultChart(runExamVm.examResult);

        $window.scrollTo(0,0);
        $location.search('order', 'HT').hash('_').replace();
    };

    //Decrypt data which is encrypted use AES algorithm
    runExamVm.decrypt = function (data, key, iv) {
        if (angular.isUndefined(data) || data.length == 0) return '';

        var encryptKey = CryptoJS.enc.Base64.parse(key);
        var myIv = CryptoJS.enc.Base64.parse(iv);

        var cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Base64.parse(data)
        });

        var decryptedData = CryptoJS.AES.decrypt(
            cipherParams,
            encryptKey,
            {iv: myIv}
        );
        return decryptedData.toString(CryptoJS.enc.Utf8);
    };

    //decrypt answer key when user finished exam and show answer key is enable
    runExamVm.decryptAnswerKey = function () {
        var nSection = runExamVm.sections.length;
        var nQuestion, nAnswer, isRight;
        var i, j, k;
        for(i=0; i<nSection; i++) {
            nQuestion = runExamVm.sections[i].questions.length;
            for(j=0; j<nQuestion; j++) {
                nAnswer = runExamVm.sections[i].questions[j].answers.length;
                for (k=0; k<nAnswer; k++) {
                    if (runExamVm.sections[i].questions[j].answers[k]['encrypted']) {
                        isRight = runExamVm.decrypt(runExamVm.sections[i].questions[j].answers[k]['isRight'],
                            runExamVm.encryptKey, runExamVm.iv);
                        runExamVm.sections[i].questions[j].answers[k]['isRight'] = (isRight > 0);

                        if (runExamVm.sections[i].questions[j].type == 2) {
                            //essay type
                            runExamVm.sections[i].questions[j].answers[k].description =
                                runExamVm.decrypt(runExamVm.sections[i].questions[j].answers[k].description,
                                    runExamVm.encryptKey, runExamVm.iv);
                        }

                        if (runExamVm.sections[i].questions[j].type == 3) {
                            //matching type
                            runExamVm.sections[i].questions[j].answers[k].correctId =
                                runExamVm.decrypt(runExamVm.sections[i].questions[j].answers[k].correctId,
                                    runExamVm.encryptKey, runExamVm.iv);
                        }

                        runExamVm.sections[i].questions[j].answers[k]['encrypted'] = false;
                    }
                }
            }
        }

        //decrypt answer in loaded sections if it is not in view
        nSection = runExamVm.loadedSections.length;
        for(i=0; i<nSection; i++) {
            nQuestion = runExamVm.loadedSections[i].questions.length;
            for(j=0; j<nQuestion; j++) {
                nAnswer = runExamVm.loadedSections[i].questions[j].answers.length;
                for (k=0; k<nAnswer; k++) {
                    if (runExamVm.loadedSections[i].questions[j].answers[k]['encrypted']) {
                        isRight = runExamVm.decrypt(runExamVm.loadedSections[i].questions[j].answers[k]['isRight'],
                            runExamVm.encryptKey, runExamVm.iv);
                        runExamVm.loadedSections[i].questions[j].answers[k]['isRight'] = (isRight > 0);

                        if (runExamVm.loadedSections[i].questions[j].type == 2) {
                            //essay type
                            runExamVm.loadedSections[i].questions[j].answers[k].description =
                                runExamVm.decrypt(runExamVm.loadedSections[i].questions[j].answers[k].description,
                                    runExamVm.encryptKey, runExamVm.iv);
                        }

                        if (runExamVm.loadedSections[i].questions[j].type == 3) {
                            //matching type
                            runExamVm.loadedSections[i].questions[j].answers[k].correctId =
                                runExamVm.decrypt(runExamVm.loadedSections[i].questions[j].answers[k].correctId,
                                    runExamVm.encryptKey, runExamVm.iv);
                        }

                        runExamVm.loadedSections[i].questions[j].answers[k]['encrypted'] = false;
                    }
                }
            }
        }

    };

    runExamVm.correctChart = null;  //chart about number questions is correct
    runExamVm.consumedTimeChart = null; //chart about consumed time
    runExamVm.scoreChart = null;    //chart about score
    runExamVm.initResultChart = function () {
        runExamVm.correctChart = {
            'labels': ['Đúng', 'Sai'],
            'colors': ['#00E676', '#DCDCDC'],
            'data': []
        };

        runExamVm.consumedTimeChart = {
            'labels': ['Thời gian đã làm', 'Còn lại'],
            'colors': ['#00ADF9', '#DCDCDC'],
            'data': []
        };

        runExamVm.scoreChart = {
            'labels': ['Mức đạt', 'Mức chưa đạt'],
            'colors': ['#803690', '#DCDCDC'],
            'data': []
        };
    };

    //extract some chart value from exam result data
    runExamVm.prepareResultChart = function (resultData) {
        runExamVm.score = (resultData.score * 1).toString();

        runExamVm.correctChart.data = [resultData.numberCorrect, resultData.totalQuestion - resultData.numberCorrect];
        runExamVm.consumedTimeChart.data = [resultData.consumedTime,
           Math.max(0, resultData.totalTime - resultData.consumedTime)];
        runExamVm.scoreChart.data = [resultData.score, Math.max(0, resultData.totalScore - resultData.score)];

        var correctRate = resultData.numberCorrect/resultData.totalQuestion;
        var consumedTimeRate = resultData.consumedTime/resultData.totalTime;
        var scoreRate = resultData.score/resultData.totalScore;

        runExamVm.medalLevel = 0;
        if (correctRate == 1 && scoreRate == 1) {
            runExamVm.medalLevel = 5;
        } else if (correctRate >= 0.8 && scoreRate >= 0.8) {
            runExamVm.medalLevel = 4;
        } else if (correctRate >= 0.6 && scoreRate >= 0.6 && consumedTimeRate <= 0.9) {
            runExamVm.medalLevel = 3;
        } else if (correctRate >= 0.3 && scoreRate >= 0.3) {
            runExamVm.medalLevel = 2;
        } else if (correctRate > 0 && scoreRate > 0) {
            runExamVm.medalLevel = 1;
        }
    };

    //user change to other question
    runExamVm.goToQuestion = function (sectionId, questionOrder) {
        if ((questionOrder != runExamVm.finishOrder) &&
            (questionOrder < 1 || questionOrder > runExamVm.numberQuestion || questionOrder == runExamVm.currentOrder)) {
            return;
        }

        if (questionOrder == runExamVm.finishOrder) {
            if (runExamVm.finishPage) return;

            if (runExamVm.examFinished) {
                runExamVm.loadingExam = true;
                runExamVm.loadingOrder = 'HT';
                runExamVm.displayFinishPage = true;

                runExamVm.finishExam();
            } else {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'confirmFinishModal.html',
                    controller: 'confirmFinishCtrl',
                    controllerAs: 'confirmFinishVm',
                    keyboard: true,
                    size: null
                });

                modalInstance.result.then(function (confirm){
                    if (confirm == true) {
                        runExamVm.loadingExam = true;
                        runExamVm.loadingOrder = 'HT';
                        runExamVm.displayFinishPage = true;

                        runExamVm.finishExam();
                    }
                });
            }
        } else {
            runExamVm.finishPage = false; //for the case user go to finish page and come back

            //check question is displayed
            var i;
            var isDisplay = false;
            var nSection = runExamVm.sections.length;
            for(i=0; i<nSection; i++) {
                if (runExamVm.sections[i].id == sectionId) {
                    isDisplay = true;
                    break;
                }
            }

            if (isDisplay) {
                if (runExamVm.currentOrder == runExamVm.finishOrder) {
                    runExamVm.currentOrder = questionOrder;
                    runExamVm.loadingExam = true;
                    runExamVm.loadingOrder = questionOrder;

                    //timeout because if use come back from result page, page is not refresh yet.
                    $timeout(function() {
                        MathJax.Hub.Queue(['Typeset', MathJax.Hub], function () {
                            $location.search('order', runExamVm.currentOrder).hash('question-' + runExamVm.currentOrder).replace();
                            $anchorScroll.yOffset = 135;
                            $anchorScroll();

                            runExamVm.reDrawAllConnect();

                            runExamVm.loadingExam = false;
                            $scope.$digest();
                        });
                    });
                } else {
                    runExamVm.currentOrder = questionOrder;

                    $location.search('order', runExamVm.currentOrder).hash('question-' + runExamVm.currentOrder).replace();
                    $anchorScroll.yOffset = 135;
                    $anchorScroll();
                }

            } else {
                //loaded more section
                nSection = runExamVm.loadedSections.length;
                for (i = runExamVm.sections.length; i < nSection; i++) {
                    runExamVm.sections.push(runExamVm.loadedSections[i]);
                    if (runExamVm.loadedSections[i].id == sectionId) {
                        break;
                    }
                }

                runExamVm.loadingExam = true;
                runExamVm.currentOrder = questionOrder;

                $timeout(function(){
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub], function () {
                        $location.search('order', runExamVm.currentOrder).hash('question-' + runExamVm.currentOrder).replace();
                        $anchorScroll.yOffset = 135;
                        $anchorScroll();

                        runExamVm.reDrawAllConnect();

                        runExamVm.loadingExam = false;

                        $scope.$digest();
                    });
                }, 0);
            }
        }

    };

    //user pause question doing
    runExamVm.exit = function () {
        runExamVm.hidingMessage = 'Đang dừng đề thi...';
        runExamVm.hidingExam = true;

        runExamVm.cancelAllRequests();
        if (runExamVm.backPage == 'edit') {
            $window.location.href = '/u/exam/' + runExamVm.examId + '/edit';
        } else {
            $window.location.href = '/u/exam/' + runExamVm.examId + '/dashboard/show';
        }
    };

    //go to page manager (button in finish page)
    runExamVm.goToPageManager = function () {
        //go to dashboard in finish page
        runExamVm.cancelAllRequests();
        if (runExamVm.backPage == 'edit') {
            $window.location.href = '/u/exam/' + runExamVm.examId + '/edit';
        } else {
            $window.location.href = '/u/exam/' + runExamVm.examId + '/dashboard/show';
        }
    };

    //cancel all unfinished request
    runExamVm.myCancelableRequests = [];
    runExamVm.cancelAllRequests = function () {
        var n = runExamVm.myCancelableRequests.length;
        for(var i=0; i < n; i++) {
            runExamVm.myCancelableRequests[i].$cancelRequest();
        }
    };

    runExamVm.shortcutKey = function () {
        $uibModal.open({
            animation: true,
            templateUrl: 'shortcutKeyModal.html',
            controller: 'shortcutKeyCtrl',
            controllerAs: 'shortcutKeyVm',
            keyboard: true,
            size: 'lg'
        });

    };

    runExamVm.pressingCtrlAlt = false;

    $scope.$on('keydown', function(evt, obj){
        console.log(obj);
        $scope.$apply(function () {
            runExamVm.pressingCtrlAlt = obj.ctrlKey && obj.altKey;
        });

        if (obj.ctrlKey && obj.altKey) {
            var helpType = -1;
            var isAvailable = false;
            var cost = 0;
            switch (obj.key) {
                case 'g':
                    helpType = 0; //reduce selection
                    isAvailable = runExamVm.isHelpReduceSelection;
                    cost = runExamVm.reduceSelectionCost;
                    break;
            }
            if (helpType != -1) {
                $scope.$apply(function () {
                    runExamVm.doHelp(helpType, isAvailable, cost);
                });
            }
        }
    });

    $scope.$on('keyup', function(evt, obj){
        $scope.$apply(function () {
            runExamVm.pressingCtrlAlt = false;
        });
    });
}]);
mainApp.controller('runQuestionCtrl', ['$scope', '$window', '$location', '$timeout', '$animate', '$uibModal', 'Fullscreen', 'RunService', function($scope, $window, $location, $timeout, $animate, $uibModal, Fullscreen, RunService){
    var runQuestionVm = this;
    runQuestionVm.statusMessage = '';
    runQuestionVm.updateTryTime = 0; //when user can not send answer to server, try again some times.
    runQuestionVm.maxTryTime = 60;

    //count unfinished requests for waiting awhile when user go to other page (pause, exit,...)
    runQuestionVm.updating = 0;

    //init Mathjax for display in detail panel only output to SVG type (not CHTML because user can drag and drop into equation and modify it)
    MathJax.Hub.Queue(["setRenderer", MathJax.Hub, "SVG"]);

    runQuestionVm.loadingQuestion = true; //flag to know question is loaded finish
    runQuestionVm.finishPage = false;     //flag to know current page is normal page to display question or finish page to display statistic result
    //init question page with data from server
    runQuestionVm.init = function (data) {
        console.log(data);

        runQuestionVm.countDownMode = 1;

        //check whether user is creator. If true, behavior will be difference.
        runQuestionVm.userIsCreator = data.userIsCreator;
        runQuestionVm.backPage = data.backPage;

        //general exam information (load one time only)
        runQuestionVm.examId = data.examId;
        runQuestionVm.coin = data.coin * 1; //remove 0 padding if any
        //runQuestionVm.timeZone = data.timeZone;
        runQuestionVm.timeWholeExam = data.timeWholeExam;

        //identify exam begin time, exam end time, and calculate exam duration in time whole exam mode
        //runQuestionVm.examBeginTime = moment.tz(data.examBeginTime, data.timeZone);
        //runQuestionVm.examEndTime = (data.examEndTime != null) ? moment.tz(data.examEndTime, data.timeZone) : null;
        // if (runQuestionVm.timeWholeExam) {
        //     runQuestionVm.duration = data.duration;
        //
        //     if (data.doToEndTime) {
        //         if (runQuestionVm.examEndTime == null
        //             || runQuestionVm.examEndTime.diff(runQuestionVm.examBeginTime, 'seconds') < 0) {
        //             runQuestionVm.duration = 201 * 3600; //make time larger than 99 hours because in client will show > 99:00:00
        //         } else {
        //             runQuestionVm.duration = runQuestionVm.examEndTime.diff(runQuestionVm.examBeginTime, 'seconds');
        //         }
        //     } else {
        //         if (runQuestionVm.examEndTime != null) {
        //             var durationFromEnd = runQuestionVm.examEndTime.diff(runQuestionVm.examBeginTime, 'seconds');
        //             if (durationFromEnd >= 0 && durationFromEnd < data.duration) {
        //                 runQuestionVm.duration = durationFromEnd;
        //             }
        //         }
        //     }
        // }

        //time for whole exam will be set only one time and when begin run
        if (runQuestionVm.timeWholeExam) {
            runQuestionVm.remainTime = data.remainTime;
            runQuestionVm.startPoint = moment();
        }

        //help cost
        runQuestionVm.reduceSelectionCost = data.reduceSelectionCost;
        runQuestionVm.increaseTimeCost = data.increaseTimeCost;
        runQuestionVm.answerLaterCost = data.answerLaterCost;
        runQuestionVm.saveTimeCost = data.saveTimeCost;
        runQuestionVm.questionAgainCost = data.questionAgainCost;
        runQuestionVm.savedTime = data.savedTime;
        runQuestionVm.numberQuestion = data.numberQuestion;

        //remain times
        runQuestionVm.remainReduceSelection = data.remainReduceSelection;
        runQuestionVm.remainIncreaseTime = data.remainIncreaseTime;
        runQuestionVm.remainAnswerLater = data.remainAnswerLater;
        runQuestionVm.remainSaveTime = data.remainSaveTime;
        runQuestionVm.remainQuestionAgain = data.remainQuestionAgain;

        //display question
        var order = data.order;
        runQuestionVm.loadedQuestionList[order] = data;
        runQuestionVm.questionOrder = data.order;
        runQuestionVm.loadQuestion(data);

        //remove init div
        var initElm = angular.element(document.querySelector('#cq-run-init'));
        initElm.remove();

        //request question status to display question pagination
        $timeout(runQuestionVm.getQuestionsStatus);

        //init result chart variables
        $timeout(runQuestionVm.initResultChart);
    };

    //<editor-fold desc="load and display question"

    /**
     * load and display question data
     * @param data
     */
    runQuestionVm.loadQuestion = function (data) {
        if (runQuestionVm.questionOrder != data.order) return;

        runQuestionVm.questionId = data.questionId;
        runQuestionVm.questionFinished = data.questionFinished;
        if (!runQuestionVm.examFinished) {
            //it maybe time out when load new question (server check again when request new question)
            //only update when exam is unfinished
            runQuestionVm.examFinished = data.examFinished;
        }
        runQuestionVm.finishPage = false;

        //runQuestionVm.countDownMode = (data.questionFinished || data.examFinished) ? 3 : 1;

        //calculate duration and set question begin time, timer, bonus
        // if (runQuestionVm.timeWholeExam) {
        //     runQuestionVm.questionBeginTime = runQuestionVm.examBeginTime;
        // } else {
        //     runQuestionVm.questionBeginTime = (runQuestionVm.userIsCreator) ?
        //         moment().tz(runQuestionVm.timeZone) : moment.tz(data.questionBeginTime, runQuestionVm.timeZone);
        //     runQuestionVm.timer = parseInt(data.timer);
        //     runQuestionVm.bonusTime = parseInt(data.bonusTime);
        //     runQuestionVm.duration = parseInt(data.timer) + parseInt(data.bonusTime);
        //
        //     console.log('load question with timer');
        //     console.log(data.timer);
        //     console.log(data.bonusTime);
        //     console.log(runQuestionVm.duration);
        //     if (runQuestionVm.examEndTime != null) {
        //         var durationFromEnd = runQuestionVm.examEndTime.diff(runQuestionVm.questionBeginTime, 'seconds');
        //         if (durationFromEnd != null && durationFromEnd >= 0 && durationFromEnd < runQuestionVm.duration) {
        //             runQuestionVm.duration = durationFromEnd;
        //         }
        //     }
        // }

        //just load remain time again for time per question
        if (!runQuestionVm.timeWholeExam) {
            runQuestionVm.remainTime = data.remainTime;
            runQuestionVm.startPoint = moment();
            console.log('duration');
            console.log(runQuestionVm.remainTime);
            console.log(runQuestionVm.startPoint);
        }

        //reset selection
        runQuestionVm.selectedRadio = null;
        runQuestionVm.selectedCheckbox = {};
        runQuestionVm.essay = "";
        runQuestionVm.matchedPairArray = {};

        //change current question on question status bar
        runQuestionVm.currentOrder = data.order;
        runQuestionVm.displayPagePagination();

        //check whether show question after finish
        runQuestionVm.showQuestion = !data.questionFinished || data.showQuestionAfterFinish;

        //check question is group type or not
        runQuestionVm.isGroupType = data.isGroupType;
        runQuestionVm.questionType = data.questionType;

        //show answer key or not
        runQuestionVm.showAnswerKey = data.showAnswerKey;

        //detail question
        runQuestionVm.numberSelection = data.numberSelection;
        runQuestionVm.sectionDescription = data.sectionDescription;
        runQuestionVm.questionDescription = data.questionDescription;
        runQuestionVm.answers = data.answers;

        //prepare answer with some variables are set such which answer is selected, which answer is match with matching text
        runQuestionVm.prepareAnswer(data.questionType, data.answers);

        //finish loading question, so disable animation loading
        runQuestionVm.loadingQuestion = false;
        runQuestionVm.loadingIcon = false;

        //check which help is permitted
        runQuestionVm.disabledReduceSelection = false;
        runQuestionVm.checkHelps();

        runQuestionVm.disabledQuestionAgain = false;

        //reset hiding message if any
        runQuestionVm.hidingMessage = '';
        runQuestionVm.hidingQuestion = false;

        //display count down mode
        if (!runQuestionVm.timeWholeExam) {
            runQuestionVm.calculateCountDown(0);
        }
        runQuestionVm.stopCountDown(); //stop count down of previous question
        if (!runQuestionVm.questionFinished) {
            runQuestionVm.calculateCountDown(runQuestionVm.remainTime);
            runQuestionVm.myCountDown = $timeout(runQuestionVm.runCountDown, 1000);
        }

        //refresh mathjax equation
        $timeout(function(){
            MathJax.Hub.Queue(['Typeset', MathJax.Hub], function () {
                runQuestionVm.refreshAfterMathjax();
            });
        }, 0);

        //scroll window to top
        $window.scrollTo(0, 0);
    };

    /**
     * set some variables depend question type to know which one is selected or matching
     * @param questionType
     * @param answers
     */
    runQuestionVm.prepareAnswer = function(questionType, answers) {
        var nAnswer = answers.length;
        var i;

        switch (questionType) {
            case 0: //single choice type
                runQuestionVm.selectedRadio = null;
                for(i=0; i < nAnswer; i++) {
                    if (answers[i].isSelected) {
                        runQuestionVm.selectedRadio = answers[i].id;
                    }
                }
                break;
            case 1: //multiple choice type
                runQuestionVm.selectedCheckbox = {};
                for(i=0; i < nAnswer; i++) {
                    runQuestionVm.selectedCheckbox[answers[i].id] = answers[i].isSelected;
                }
                break;
            case 2: //essay type
                runQuestionVm.essay = answers[0].essay;
                break;
            case 3: //matching type
                runQuestionVm.matchedPairArray = {};
                for(i=0; i < nAnswer; i++) {
                    runQuestionVm.matchedPairArray[answers[i].order] = answers[i].matchId;
                }
                runQuestionVm.resetSelectedMatch();
                break;
        }
    };

    runQuestionVm.loadedQuestionList = {};  //list of loaded question
    /**
     * preload some questions around current question.
     * Two previous questions, two next questions
     */
    runQuestionVm.preLoadQuestions = function () {
        if (runQuestionVm.questionsStatus == null) return;
        var order, questionId;

        var delta = [1, 2, -1, -2]; //priority order
        for(var i =0; i < 4; i++) {
            order = runQuestionVm.questionOrder + delta[i];
            //check order over boundary
            if (order > 0 && order <= runQuestionVm.numberQuestion && order != runQuestionVm.questionOrder) {
                //load unload questions
                if (angular.isUndefined(runQuestionVm.loadedQuestionList[order])) {
                    var currentPageItem = runQuestionVm.identifyPageItem(order); //get page item index
                    if (currentPageItem == null) continue;
                    questionId = runQuestionVm.questionsStatus[currentPageItem].id; //get question id in question status list

                    //request to get preload questions
                    var myRequest = RunService.preLoadQuestion({examId: runQuestionVm.examId, questionId: questionId}, function successCallback(response){
                        if (response.success) {
                            var order = response.questionData.order;
                            if (angular.isUndefined(runQuestionVm.loadedQuestionList[order])) {
                                //check again because user can load directly while preload question is coming back
                                runQuestionVm.loadedQuestionList[order] = response.questionData;
                            }
                        }

                        console.log('Load more');
                        console.log(runQuestionVm.loadedQuestionList);
                    }, function errorCallback(response){
                        console.log('error');
                        console.log(response);
                    });

                    //add current request to cancel it when need
                    if (runQuestionVm.myCancelableRequests.length >= 500) {
                        runQuestionVm.myCancelableRequests.shift();
                    }
                    runQuestionVm.myCancelableRequests.push(myRequest);
                }
            }
        }
    };

    /**
     * redraw matching connect after refresh mathjax equation
     */
    runQuestionVm.refreshAfterMathjax = function () {
        //matching type
        $timeout(runQuestionVm.drawConnect);
    };

    /**
     * Decrypt data which is encrypted use AES algorithm
     * @param data
     * @param key
     * @param iv
     * @returns {*}
     */
    runQuestionVm.decrypt = function (data, key, iv) {
        if (angular.isUndefined(data) || data.length == 0) return '';

        var encryptKey = CryptoJS.enc.Base64.parse(key);
        var myIv = CryptoJS.enc.Base64.parse(iv);

        var cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Base64.parse(data)
        });

        var decryptedData = CryptoJS.AES.decrypt(
            cipherParams,
            encryptKey,
            {iv: myIv}
        );
        return decryptedData.toString(CryptoJS.enc.Utf8);
    };

    /**
     * call to decrypt question's elements which is encrypted
     * @param order
     * @param encryptKey
     * @param iv
     */
    runQuestionVm.decryptQuestion = function(order, encryptKey, iv) {
        if (angular.isUndefined(runQuestionVm.loadedQuestionList[order])) return;

        runQuestionVm.loadedQuestionList[order].sectionDescription =
            runQuestionVm.decrypt(runQuestionVm.loadedQuestionList[order].sectionDescription, encryptKey, iv);
        runQuestionVm.loadedQuestionList[order].questionDescription =
            runQuestionVm.decrypt(runQuestionVm.loadedQuestionList[order].questionDescription, encryptKey, iv);

        var nAnswer = runQuestionVm.loadedQuestionList[order].answers.length;
        for(var i=0; i < nAnswer; i++) {
            runQuestionVm.loadedQuestionList[order].answers[i].description =
                runQuestionVm.decrypt(runQuestionVm.loadedQuestionList[order].answers[i].description, encryptKey, iv);

            if (angular.isDefined(runQuestionVm.loadedQuestionList[order].answers[i].match)) {
                runQuestionVm.loadedQuestionList[order].answers[i].match =
                    runQuestionVm.decrypt(runQuestionVm.loadedQuestionList[order].answers[i].match, encryptKey, iv);
            }
        }
    };

    runQuestionVm.getNameFromNumber = function (num) {
        var numeric = (num - 1) % 26;
        var letter = String.fromCharCode(65 + numeric);
        var num2 = Math.floor((num - 1) / 26);
        if (num2 > 0) {
            return runQuestionVm.getNameFromNumber(num2) + letter;
        } else {
            return letter;
        }
    };
    //</editor-fold>

    //<editor-fold desc="help">
    runQuestionVm.disabledReduceSelection = false; //reduce selection is used only one time
    runQuestionVm.disabledQuestionAgain = false; //use for answer later
    /**
     * Check to enable/disable helps
     */
    runQuestionVm.checkHelps = function () {
        //Reduce selection is used only one time
        if (runQuestionVm.disabledReduceSelection) {
            runQuestionVm.isHelpReduceSelection = false;
        } else {
            runQuestionVm.isHelpReduceSelection = (!runQuestionVm.questionFinished
                && runQuestionVm.reduceSelectionCost >= 0
                && (runQuestionVm.userIsCreator || runQuestionVm.reduceSelectionCost <= runQuestionVm.coin)
                && runQuestionVm.remainReduceSelection > 0
            );
        }

        if (runQuestionVm.timeWholeExam) {
            //not apply some helps in time whole exam
            runQuestionVm.isHelpIncreaseTime = false;
            runQuestionVm.isHelpAnswerLater = false;
            runQuestionVm.isHelpSaveTime = false;
            runQuestionVm.isHelpQuestionAgain = false;
            runQuestionVm.isHelpTime = false;
        } else {
            //enable/disable some helps depend on situation
            runQuestionVm.isHelpIncreaseTime = (!runQuestionVm.questionFinished
                && runQuestionVm.increaseTimeCost >= 0
                && (runQuestionVm.userIsCreator || runQuestionVm.increaseTimeCost <= runQuestionVm.coin)
                && runQuestionVm.remainIncreaseTime > 0
            );

            runQuestionVm.isHelpAnswerLater = (!runQuestionVm.questionFinished
                && runQuestionVm.answerLaterCost >= 0
                && (runQuestionVm.userIsCreator || runQuestionVm.answerLaterCost <= runQuestionVm.coin)
                && runQuestionVm.remainAnswerLater > 0
            );

            runQuestionVm.isHelpSaveTime = (!runQuestionVm.questionFinished
                && runQuestionVm.saveTimeCost >= 0
                && (runQuestionVm.userIsCreator || runQuestionVm.saveTimeCost <= runQuestionVm.coin)
                && runQuestionVm.remainSaveTime > 0
            );

            runQuestionVm.isHelpQuestionAgain = (!runQuestionVm.disabledQuestionAgain
                && !runQuestionVm.examFinished
                && runQuestionVm.questionFinished
                && runQuestionVm.questionAgainCost >= 0
                && (runQuestionVm.userIsCreator || runQuestionVm.questionAgainCost <= runQuestionVm.coin)
                && runQuestionVm.remainQuestionAgain > 0
            );

            runQuestionVm.isHelpTime = (!runQuestionVm.questionFinished
                && runQuestionVm.savedTime > 0);
        }
    };

    /**
     * Disable all helps
     */
    runQuestionVm.disableHelps = function () {
        runQuestionVm.isHelpReduceSelection = false;
        runQuestionVm.isHelpIncreaseTime = false;
        runQuestionVm.isHelpAnswerLater = false;
        runQuestionVm.isHelpSaveTime = false;
        runQuestionVm.isHelpQuestionAgain = false;
        runQuestionVm.isHelpTime = false;
    };
    //</editor-fold>

    //<editor-fold desc="display pagination">
    runQuestionVm.questionsStatus = null;       //list of question status will be displayed on header bar
    /**
     * Request server for questions status
     */
    runQuestionVm.getQuestionsStatus = function () {
        RunService.getQuestionsStatus({examId: runQuestionVm.examId}, function successCallback(response){
            if (response.success) {
                runQuestionVm.questionsStatus = response.questionsStatus;
                runQuestionVm.displayPagePagination();  //display page pagination after receive question status
                runQuestionVm.preLoadQuestions();   //preload some question
            }
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
        });
    };

    runQuestionVm.pages = {};   //question page status is displaying on header bar
    runQuestionVm.currentOrder = 1; //current question order
    runQuestionVm.pages.previous = false;  //previous button is display or not
    runQuestionVm.pages.next = false;      //next button is display or not
    runQuestionVm.pages.viewFrame = []; //current view frame
    /**
     * display question list pagination
     */
    runQuestionVm.displayPagePagination = function () {
        if (runQuestionVm.questionsStatus == null) return;

        runQuestionVm.identifyNumberItemPerPage();
        var currentPageItem = runQuestionVm.identifyPageItem(runQuestionVm.currentOrder);

        var middle =  runQuestionVm.numberItemPerPage/2;
        //if page index larger than mid, it will be stand on position mid
        var firstPage = (currentPageItem > middle) ? (currentPageItem - middle) : 0;

        //from firstPage...numberItemPerPage
        var n = Math.min(firstPage + runQuestionVm.numberItemPerPage, runQuestionVm.questionsStatus.length);
        var k = Math.max(n - runQuestionVm.numberItemPerPage, 0);
        runQuestionVm.pages.viewFrame = [];
        for (var i = k; i<n; i++) {
            if (angular.isDefined(runQuestionVm.questionsStatus[i])) {
                var page = {};
                // if (runQuestionVm.questionsStatus != null) {
                page.order = runQuestionVm.questionsStatus[i]['order'];
                page.id = runQuestionVm.questionsStatus[i]['id'];
                page.done = runQuestionVm.questionsStatus[i]['done'];
                // } else {
                //     page.order = i + 1;
                //     page.done = false;
                //     page.id = null;
                // }
                runQuestionVm.pages.viewFrame.push(page); //create current view frame
            }
        }

        //add finish button to question status bar if user go to last view frame
        runQuestionVm.addFinishPageToFrame(n);

        //check enable/disable previous/next button
        runQuestionVm.pages.previous = (k > 0);
        runQuestionVm.pages.next = (n < runQuestionVm.questionsStatus.length);
    };

    runQuestionVm.finishOrder = 'Hoàn thành';   //finish button label
    //add finish button to current view frame (last view frame)
    runQuestionVm.addFinishPageToFrame = function (lastItem) {
        //if current view frame is last view, display finish button
        if (lastItem == runQuestionVm.questionsStatus.length) {
            var finishPageItem = {};
            finishPageItem.order = runQuestionVm.finishOrder;
            finishPageItem.id = null;
            finishPageItem.done = false;
            runQuestionVm.pages.viewFrame.push(finishPageItem);
        }
    };

    /**
     * user click previous button to view previous frame
     */
    runQuestionVm.viewPreviousFrame = function () {
        var firstPageItem = runQuestionVm.identifyPageItem(runQuestionVm.pages.viewFrame[0].order);
        if (firstPageItem == 0) return;

        var k = Math.max(firstPageItem - runQuestionVm.numberItemPerPage, 0);
        var n = Math.min(k + runQuestionVm.numberItemPerPage, runQuestionVm.questionsStatus.length);
        runQuestionVm.pages.viewFrame = [];
        for (var i=k; i<n; i++) {
            if (angular.isDefined(runQuestionVm.questionsStatus[i])) {
                var page = {};
                // if (runQuestionVm.questionsStatus != null) {
                    page.order = runQuestionVm.questionsStatus[i]['order'];
                    page.id = runQuestionVm.questionsStatus[i]['id'];
                    page.done = runQuestionVm.questionsStatus[i]['done'];
                // } else {
                //     page.order = i + 1;
                //     page.done = false;
                //     page.id = null;
                // }
                runQuestionVm.pages.viewFrame.push(page);
            }
        }

        //add finish button to question status bar if user go to last view frame
        runQuestionVm.addFinishPageToFrame(n);

        //check enable/disable previous/next button
        runQuestionVm.pages.previous = (k > 0);
        runQuestionVm.pages.next = (n < runQuestionVm.questionsStatus.length);
    };

    /**
     * user click next button to view next frame
     */
    runQuestionVm.viewNextFrame = function () {
        var lastPageItemOrder = runQuestionVm.pages.viewFrame[runQuestionVm.pages.viewFrame.length - 1].order;
        if (lastPageItemOrder == runQuestionVm.finishOrder) return;

        var lastPageItem = runQuestionVm.identifyPageItem(lastPageItemOrder);

        var n = Math.min(lastPageItem + runQuestionVm.numberItemPerPage, runQuestionVm.questionsStatus.length);
        var k = Math.max(n - runQuestionVm.numberItemPerPage, 0);
        runQuestionVm.pages.viewFrame = [];
        for (var i = k; i<n; i++) {
            if (angular.isDefined(runQuestionVm.questionsStatus[i])) {
                var page = {};
                // if (runQuestionVm.questionsStatus != null) {
                    page.order = runQuestionVm.questionsStatus[i]['order'];
                    page.id = runQuestionVm.questionsStatus[i]['id'];
                    page.done = runQuestionVm.questionsStatus[i]['done'];
                // } else {
                //     page.order = i + 1;
                //     page.done = false;
                //     page.id = null;
                // }
            }
            runQuestionVm.pages.viewFrame.push(page);
        }

        //add finish button to question status bar if user go to last view frame
        runQuestionVm.addFinishPageToFrame(n);

        //check enable/disable previous/next button
        runQuestionVm.pages.next = (n < runQuestionVm.questionsStatus.length);
        runQuestionVm.pages.previous = (k > 0);
    };

    runQuestionVm.numberItemPerPage = 0;    //number question status item per page
    //identify number item per page when user change window size
    runQuestionVm.identifyNumberItemPerPage = function () {
        //all magic width in this function is identified by experience (manually)
        var width = runQuestionVm.myWindow.width();
        if(width > 1150) {
            runQuestionVm.numberItemPerPage = 22;
        } else if(width <= 1150 && width > 880) {
            runQuestionVm.numberItemPerPage = 16;
        } else if (width <= 880 && width > 526) {
            runQuestionVm.numberItemPerPage = 8;
        } else if (width <= 526 && width > 350) {
            runQuestionVm.numberItemPerPage = 4;
        } else {
            runQuestionVm.numberItemPerPage = 2;
        }
    };

    //get question index based on its order
    runQuestionVm.identifyPageItem = function (order) {
        if (runQuestionVm.questionsStatus == null) return null;

        var n = runQuestionVm.questionsStatus.length;
        for(var i=0; i < n; i++) {
            if (runQuestionVm.questionsStatus[i].order == order) {
                return i;
            }
        }

    };
    //</editor-fold>

    //<editor-fold desc="update single choice and multiple choice question">
    //user answer for single choice question by click on description
    runQuestionVm.selectRadio = function(id) {
        if (!runQuestionVm.questionFinished && runQuestionVm.selectedRadio != id) {
            runQuestionVm.selectedRadio = id;
            runQuestionVm.updateRadio();
        }
    };

    //user answer for single choice question by click on radio button
    runQuestionVm.updateRadio = function() {
        if (runQuestionVm.questionFinished || runQuestionVm.selectedRadio == null) return;

        var n = runQuestionVm.answers.length;
        for(var i=0; i < n; i++) {
            runQuestionVm.answers[i]['isSelected'] = (runQuestionVm.answers[i]['id'] == runQuestionVm.selectedRadio);
        }

        var runService = new RunService({examId: runQuestionVm.examId, questionId: runQuestionVm.questionId});
        runService['selectedId'] = runQuestionVm.selectedRadio;

        runQuestionVm.updating++;
        runService.$updateAnswers(function successCallback(response){
            runQuestionVm.updating--;
            runQuestionVm.updateTryTime = 0;
        }, function errorCallback(response){
            console.log('error');
            console.log(response);
            runQuestionVm.updating--;

            runQuestionVm.statusMessage = 'Chưa cập nhật câu trả lời được. Đang gửi lại...';
            if (runQuestionVm.updateTryTime < runQuestionVm.maxTryTime) {
                runQuestionVm.updateTryTime++;
                $timeout(runQuestionVm.updateRadio, 5000);
            }
        });
    };

    //user answer for multiple choice question by click on description
    runQuestionVm.selectCheckbox = function(id) {
        if (!runQuestionVm.questionFinished) {
            runQuestionVm.selectedCheckbox[id] = !runQuestionVm.selectedCheckbox[id];
            runQuestionVm.updateCheckbox();
        }
    };

    //user answer for multiple choice question by click on checkbox button
    runQuestionVm.updateCheckbox = function() {
        if (runQuestionVm.questionFinished) return;

        var n = runQuestionVm.answers.length;
        var answerId;
        for(var i=0; i < n; i++) {
            answerId = runQuestionVm.answers[i]['id'];
            runQuestionVm.answers[i]['isSelected'] = runQuestionVm.selectedCheckbox[answerId];
        }

        var runService = new RunService({examId: runQuestionVm.examId, questionId: runQuestionVm.questionId});
        runService['checkedStatusArray'] = runQuestionVm.selectedCheckbox;

        runQuestionVm.updating++;
        runService.$updateAnswers(function successCallback(response){
            runQuestionVm.updating--;
            runQuestionVm.updateTryTime = 0;
        }, function errorCallback(response){
            console.log('error');
            console.log(response);
            runQuestionVm.updating--;

            runQuestionVm.statusMessage = 'Chưa cập nhật câu trả lời được. Đang gửi lại...';
            if (runQuestionVm.updateTryTime < runQuestionVm.maxTryTime) {
                runQuestionVm.updateTryTime++;
                $timeout(runQuestionVm.updateCheckbox, 5000);
            }
        });
    };
    //</editor-fold>

    //<editor-fold desc="count down mode">
    //extract some time value to display on progress bar
    runQuestionVm.calculateCountDown = function (remainTime) {
        runQuestionVm.currentSecond = remainTime % 60;
        runQuestionVm.currentMinute = (Math.floor(remainTime / 60)) % 60;
        runQuestionVm.currentHour = (Math.floor(remainTime / 3600));

        if (runQuestionVm.currentHour < 100) {
            runQuestionVm.digitalTimer = ('0' + runQuestionVm.currentHour).slice(-2) + ':' + ('0' + runQuestionVm.currentMinute).slice(-2)
                + ':' + ('0' + runQuestionVm.currentSecond).slice(-2);
        } else {
            runQuestionVm.digitalTimer = '> 99' + ':' + ('0' + runQuestionVm.currentMinute).slice(-2)
                + ':' + ('0' + runQuestionVm.currentSecond).slice(-2);
        }

        //decrease hour for display by progress bar
        runQuestionVm.currentHour = runQuestionVm.currentHour > 24 ? 24 : runQuestionVm.currentHour;
    };

    runQuestionVm.myCountDown = null;   //timer promise is used for cancel later
    runQuestionVm.localRemainTime = 0;
    //run count down
    runQuestionVm.runCountDown = function () {
        //Notes: do not count down by decrease a variable, because javascript will be off, when user click other tab/program.
        //It's mean if this app is not active, javascript will be disabled (not work)
        //var now = moment().tz(runQuestionVm.timeZone);
        // var now = moment.utc();
        // var beginToNow = now.diff(runQuestionVm.questionBeginTime, 'seconds');

        var now = moment();
        var startToNow = now.diff(runQuestionVm.startPoint, 'seconds');

        // console.log('cd');
        // console.log(runQuestionVm.duration);
        // console.log(beginToNow);
        runQuestionVm.localRemainTime = runQuestionVm.remainTime - startToNow;
        // console.log(runQuestionVm.remainTime);
        if (runQuestionVm.localRemainTime > 0) {
            //runQuestionVm.remainTime--;
            if (runQuestionVm.countDownMode != 0) {
                runQuestionVm.calculateCountDown(runQuestionVm.localRemainTime);
            }
            runQuestionVm.myCountDown = $timeout(runQuestionVm.runCountDown,1000);
        } else {
            runQuestionVm.localRemainTime = 0; //make sure is set to 0
            runQuestionVm.calculateCountDown(runQuestionVm.localRemainTime);
            runQuestionVm.closeQuestion();
            runQuestionVm.checkHelps();

            if (runQuestionVm.timeWholeExam) {
                runQuestionVm.examFinished = true;
            }
        }
    };

    //stop count down
    runQuestionVm.stopCountDown = function () {
        $timeout.cancel(runQuestionVm.myCountDown);
    };

    //user click on count down area to change count down display mode
    runQuestionVm.changeCountDownMode = function () {
        switch (runQuestionVm.countDownMode) {
            case 0:
                runQuestionVm.countDownMode = 1; //display count down (full mode): progress and timer
                break;
            case 1:
                runQuestionVm.countDownMode = 2; //display count down with timer
                break;
            case 2:
                runQuestionVm.countDownMode = 3; //display count down with progress
                break;
            default:
                runQuestionVm.countDownMode = 0; //non-display
                break;
        }
    };

    //</editor-fold>

    //<editor-fold desc="close question">
    //close question when user go to other question
    runQuestionVm.closeQuestion = function () {
        if (runQuestionVm.questionFinished) return;

        if (!runQuestionVm.timeWholeExam) {
            //reset count down display
            runQuestionVm.calculateCountDown(0);
        }

        runQuestionVm.stopCountDown();

        var order = runQuestionVm.questionOrder;
        var questionId = runQuestionVm.questionId;

        if (runQuestionVm.questionType == 3) {
            //draw again with matching type because appear message div on top make line not correct
            $timeout(runQuestionVm.drawConnect);
        }

        //closing question
        runQuestionVm.questionFinished = true;
        if (runQuestionVm.updating > 0) {
            //delay 1s if user change but it have not been updated yet
            $timeout(function() {
                runQuestionVm.closeQuestionService(order, questionId);
            }, 1000);
        } else {
            if (runQuestionVm.questionType == 2 && runQuestionVm.questionEditing) {
                //use essay pseudo input to force tinymce blur for updating content
                var essayPseudo = angular.element(document.querySelector('#essay-pseudo'));
                essayPseudo.focus();
                $timeout(function() {
                    runQuestionVm.closeQuestionService(order, questionId);
                }, 1000);
            } else {
                runQuestionVm.closeQuestionService(order, questionId);
            }
        }
    };

    //service to close question
    runQuestionVm.closeQuestionService = function (order, questionId) {
        if (angular.isUndefined(runQuestionVm.loadedQuestionList[order])) return;

        if (!runQuestionVm.timeWholeExam) {
            //set question finish in loaded question list
            runQuestionVm.loadedQuestionList[order].questionFinished = true;
        }

        if (runQuestionVm.questionsStatus != null) {
            //set question status to done
            var currentPageItem = runQuestionVm.identifyPageItem(order);
            runQuestionVm.questionsStatus[currentPageItem].done = true;

            var nQ = runQuestionVm.pages.viewFrame.length;
            for(var i = 0; i < nQ; i++) {
                if (runQuestionVm.pages.viewFrame[i].id == questionId) {
                    runQuestionVm.pages.viewFrame[i].done = true;
                    break;
                }
            }
        }

        var runService = new RunService({examId: runQuestionVm.examId, questionId: questionId});
        runService['order'] = order;

        //request server to close question
        runService.$closeQuestion(function successCallback(response){

            if (response.success) {
                var order = response.order;
                runQuestionVm.loadedQuestionList[order].showAnswerKey = response.data.showAnswerKey;

                if (response.data.showAnswerKey && angular.isDefined(response.data.answers)) {
                    var i, nAnswer;
                    nAnswer = response.data.answers.length;
                    switch (runQuestionVm.loadedQuestionList[order].questionType) {
                        case 0: //single choice
                        case 1: //multiple choice
                            for(i=0; i < nAnswer; i++) {
                                var answer = response.data.answers[i];
                                var answerOrder = answer.order;
                                if (answerOrder == runQuestionVm.loadedQuestionList[order].answers[i]['order']) {
                                    runQuestionVm.loadedQuestionList[order].answers[i]['isRight'] = answer.isRight;
                                }
                            }
                            break;
                        case 2: //essay
                            runQuestionVm.loadedQuestionList[order].answers[0].isRight = response.data.answers[0].isRight;
                            runQuestionVm.loadedQuestionList[order].answers[0].description = response.data.answers[0].description;
                            break;
                        case 3: //matching
                            for(i=0; i < nAnswer; i++) {
                                if (runQuestionVm.loadedQuestionList[order].answers[i]['order'] == response.data.answers[i]['order']) {
                                    runQuestionVm.loadedQuestionList[order].answers[i].isRight = response.data.answers[i]['isRight'];
                                    runQuestionVm.loadedQuestionList[order].answers[i].correctId = response.data.answers[i]['correctId'];
                                }
                            }

                            $timeout(runQuestionVm.drawConnect);
                            break;
                    }
                }

                //special case: if finish exam, user must wait question is closed before finish exam
                // because question require to done (is_done is true) and statistic will be correct
                if (runQuestionVm.loadingOrder == 'HT') {
                    var currentLocation = $location.path();
                    currentLocation = currentLocation.substr(0, currentLocation.lastIndexOf('/') + 1) + 'finish';
                    var parameters = {'confirmed': 1};
                    if (runQuestionVm.backPage == 'edit') {
                        parameters['trying'] = 1;
                    }
                    $location.path(currentLocation).search(parameters);
                }
            }
        },function errorCallback(response){
            console.log('error');
            console.log(response);
        });
    };
    //</editor-fold>

    //<editor-fold desc="change window size">
    runQuestionVm.isFullScreen = false;     //flag to know fullscreen or not
    //toggle display fullscreen
    runQuestionVm.goFullScreen = function () {
        if (Fullscreen.isEnabled()) {
            Fullscreen.cancel();
            runQuestionVm.isFullScreen = false;
        }
        else {
            Fullscreen.all();
            runQuestionVm.isFullScreen = true;
        }

    };

    //detect window size change and update question list and draw matching link
    runQuestionVm.myWindow = angular.element($window);  //get current window element
    //callback function when window is changed size
    runQuestionVm.myWindow.on('resize', function() {
        runQuestionVm.displayPagePagination();

        //redraw all connect of answer match
        $timeout(runQuestionVm.drawConnect);

        // don't forget manually trigger $digest()
        $scope.$digest();
    });

    //</editor-fold>

    //<editor-fold desc="essay answer">
    var customToolbar = "fontselect | fontsizeselect | forecolor backcolor |" +
        " alignleft aligncenter alignright alignjustify |" +
        " bullist numlist indent outdent | image media | code | mathtype";

    runQuestionVm.questionEditing = false;  //flag to know question is editing or not
    //tinymce editor settings
    runQuestionVm.editorSettings = {
        language_url : '/js/tinymce-v451/langs/vi.js',
        external_plugins: {
            'advlist': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/advlist/plugin.min.js',
            'link': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/link/plugin.min.js',
            'image': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/image/plugin.min.js',
            'imagetools': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/imagetools/plugin.min.js',
            'lists': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/lists/plugin.min.js',
            'charmap': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/charmap/plugin.min.js',
            'hr': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/hr/plugin.min.js',
            'searchreplace': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/searchreplace/plugin.min.js',
            'media': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/media/plugin.min.js',
            'table': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/table/plugin.min.js',
            'contextmenu': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/contextmenu/plugin.min.js',
            'paste': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/paste/plugin.min.js',
            'textcolor': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/textcolor/plugin.min.js',
            'colorpicker': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/colorpicker/plugin.min.js',
            'code': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.1/plugins/code/plugin.min.js'
        },
        themes: "inlite",
        inline: true,
        trusted: true, // all TinyMCE content that is set to ngModel will be whitelisted by $sce
        theme: "modern",
        language: 'vi',
        plugins: [
            "advlist link image imagetools lists charmap hr",
            "searchreplace media",
            "table contextmenu paste textcolor colorpicker code"
        ], //don't use code plugin, because MathJax script will modified
        contextmenu: "cut copy paste | link image inserttable | cell row column deletetable",
        menu: {
            edit: {title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall | searchreplace'},
            insert: {title: 'Insert', items: 'image media link | charmap hr template | mathtype'},
            format: {title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat'},
            table: {title: 'Table', items: 'inserttable tableprops deletetable | cell row column'},
            tools: {title: 'Tools', items: 'code'},
            help: {title: 'Help', items: 'editorhelp mathtypehelp'}
        },
        menubar: "edit insert format table tools help",
        toolbar: customToolbar,
        table_default_styles: {
            width: '100%'
        },
        statusbar: false,
        fontsize_formats: '8pt 10pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 32pt 36pt 48pt 72pt',
        custom_undo_redo_levels: 10,
        image_advtab: true,
        relative_urls: false,
        remove_script_host: false,
        convert_urls : true,
        //paste_retain_style_properties: "color font-weight text-align text-decoration border background float display",
        content_css: ["/css/bootstrap.min.css?" + new Date().getTime()], //add some attribute
        entity_encoding: 'raw', //for optimize speed
        //height: 350,
        extended_valid_elements: '*[*]', //allow because of inserting math equation with block div (when insert, it auto delete all previous script)
        setup: function(editor) {
            editor.addMenuItem('editorhelp', {
                text: 'Editor guide',
                context: 'help',
                onclick: function() {
                    editor.windowManager.open({
                        title: 'Hướng dẫn soạn thảo',
                        url: '/guide/editor',
                        width: 700,
                        height: 570
                    });
                }
            });
            editor.addMenuItem('mathtypehelp', {
                text: 'Mathtype guide',
                context: 'help',
                onclick: function() {
                    editor.windowManager.open({
                        title: 'Hướng dẫn gõ công thức',
                        url: '/guide/mathtype',
                        width: 800,
                        height: 570
                    });
                }
            });

            function loadMathType() {
                editor.windowManager.open({
                    title: 'Công thức',
                    url: '/u/mathtype',
                    width: 700, //no bigger because windows not change when browser change size, or if screen is smaller, can not scroll to see
                    height: 600
                }, {
                    oninsert: function (equation, blockDisplay) {
                        //detailVm.initTinyMceWithNoChange = false; //user interacted with editor. if user init tinymce and add new image, it must be saved.

                        //make sure that math equation in template
                        var formattedEquation;
                        //&#8203; -> zero-width space can not be used because when undo/redo tinymce auto delete
                        if (blockDisplay) {
                            formattedEquation = '<div class="math">' +
                                    //'<span>&#8203;</span>' +
                                '$$' + equation + '$$' +
                                    //'<span class="scriptMath" style="display:none">' +
                                    //'$$' + equation + '$$' +
                                    //'</span>' +
                                '</div>' + '<p></p>';
                        } else {
                            //zero-width non-joined placed in math element and previous equation
                            //this make image when drag into before math element and drag next, equation will did not disappear
                            formattedEquation =
                                '&nbsp;' +         //prevent delete equation when delete before character
                                '\\(' + equation + '\\)' +
                                '&#8204;&nbsp;';
                            //zero-width non-joined placed in last and out math element,
                            //this make user can not go into equation and type continue
                        }

                        editor.insertContent(formattedEquation, null);
                        MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id]); //refresh MathJax
                    }
                });
            }

            editor.addMenuItem('mathtype', {
                text: 'Công thức',
                context: 'insert',
                icon: 'sigma',
                onclick: function() {
                    loadMathType();
                }
            });

            editor.addButton("mathtype", {
                text: 'Công thức',
                //title: "",
                tooltip: "Gõ công thức toán, hóa học",
                icon: false,
                onclick: function() {
                    loadMathType();
                }
            });

            editor.on('init', function() {
                runQuestionVm.essayEditor = editor;
                editor.selectedMathId = null;
                editor.selectedMathDisplay = false; //true is display block
                editor.moveNext = true;
                editor.pressSpace = false;
                editor.beginInlineMath = false;
                editor.endInlineMath = false;
                editor.runMathJax = false;

                //refresh when init math (use in the case user move to other place)
                $('#' + editor.id).find('.scriptMath').each(function(){
                    var scriptMath = $(this).html();
                    $(this).before(scriptMath);
                });
                MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id, function (){
                    if (runQuestionVm.questionType == 2) {
                        //essay type
                        angular.element('#' + editor.id).focus();
                        console.log('focused on ' + editor.id);
                    }
                }]);
            });

            editor.on('change', function() {
                if (editor.endInlineMath) {
                    editor.endInlineMath = false; //must before insert space (execCommand)
                    editor.runMathJax = true;
                    editor.execCommand('mceInsertContent', false, "&zwnj;"); //will call change event again
                } else if (editor.runMathJax) {
                    editor.runMathJax = false;
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id]);
                }
            });

            editor.on('click', function(e) {
                //math equation in template is same as mathtype plugin

                runQuestionVm.questionEditing = true;
                var currentElm = $(e.target);

                //check if node is clicked is mathjax SVG, create editing math element
                var mathJaxNode = currentElm.closest('.MathJax_SVG');

                if (mathJaxNode.length > 0) {
                    //if user is staying the equation, after that go into other equation,
                    //we convert the equation to SVG before edit new selected equation
                    if (editor.selectedMathId != null && mathJaxNode.attr('id') != editor.selectedMathId)
                    {
                        var editMathElm = $('.editMath'); //find edit math element
                        if (editMathElm.length > 0) {
                            var text = editMathElm.html();
                            //editMathElm.next('script').html(text);

                            if (editor.selectedMathDisplay) {
                                var blockElm2 = editMathElm.closest('.MathJax_SVG_Display');
                                blockElm2.replaceWith('$$' + text + '$$');
                            } else {
                                editMathElm.replaceWith('\\(' + text + '\\)');
                            }
                            MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id], function() {
                                //callback function is called after convert previous math element
                                //It create editing math element
                                editor.selectedMathId = mathJaxNode.attr('id');

                                //get raw equation and remove script tag of MathJax
                                var scriptElm, originalText;

                                var blockElm = currentElm.closest('.MathJax_SVG_Display');
                                if (blockElm.length > 0) {
                                    //if equation is block display, it have div outside to make style center align
                                    //so go up one level to get script element
                                    scriptElm = blockElm.next('script');
                                } else {
                                    scriptElm = mathJaxNode.next('script');
                                }
                                originalText = scriptElm.html();
                                editor.selectedMathDisplay = (scriptElm.attr('type').indexOf('mode=display') > -1);
                                scriptElm.remove();

                                //insert editing math element
                                mathJaxNode.after('<span class="editMath" id="editMath_' + editor.selectedMathId + '" style="border: 1px solid red; padding: 2px 2px;">' + originalText + '</span>');
                                mathJaxNode.remove();
                            });
                        }
                    } else {
                        //create editing math element
                        editor.selectedMathId = mathJaxNode.attr('id');

                        //get raw equation and remove script tag of MathJax
                        var scriptElm, originalText;

                        var blockElm = currentElm.closest('.MathJax_SVG_Display');
                        if (blockElm.length > 0) {
                            //if equation is block display, it have div outside to make style center align
                            //so go up one level to get script element
                            scriptElm = blockElm.next('script');
                        } else {
                            scriptElm = mathJaxNode.next('script');
                        }
                        originalText = scriptElm.html();
                        editor.selectedMathDisplay = (scriptElm.attr('type').indexOf('mode=display') > -1);
                        scriptElm.remove();

                        //insert editing math element
                        mathJaxNode.after('<span class="editMath" id="editMath_' + editor.selectedMathId + '" style="border: 1px solid red; padding: 2px 2px;">' + originalText + '</span>');
                        mathJaxNode.remove();
                    }

                }
            });

            editor.on('blur', function(){
                runQuestionVm.questionEditing = false;
                //Khong duoc chinh sua math o day vi khi click vao math no vua thuc hien lost focus (blur) vua focus
            });

            editor.on('NodeChange', function(e){
                var currentElm = $(e.element);

                //move image out of math element if it is being inside when user drag and drop image
                var mathElm = currentElm.closest('.MathJax_SVG_Display'); //block display math
                if (mathElm.length == 0) {
                    mathElm = currentElm.closest('.MathJax_SVG'); //inline display math
                }
                if (mathElm.length > 0) {
                    var imgNode = mathElm.find('img');
                    if (imgNode.length > 0) {
                        imgNode.remove();
                        mathElm.before(imgNode);
                        mathElm.before('&zwnj;');
                    }
                }

                var editingMathElm = currentElm.closest('.editMath');
                if (editingMathElm.length == 0 && editor.selectedMathId != null) {
                    //if current element is not editing math element and previous selected is editing math element,
                    //make previous to math display
                    //In other word, when node change and is not editing math node,
                    //if previous node is math, add symbol to equation. After that, MathJax will convert it to SVG
                    var editMathElm = $('.editMath'); //get all editing math node if any
                    if (editMathElm.length > 0) {
                        editor.selectedMathId = null; //clear selected math node

                        var text = editMathElm.html();
                        if (editor.selectedMathDisplay) {
                            var blockElm = editMathElm.closest('.MathJax_SVG_Display');

                            blockElm.replaceWith('$$' + text + '$$'); //add special symbol
                        } else {
                            editMathElm.replaceWith('\\(' + text + '\\)'); //add special symbol
                        }
                        MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.id]); //refresh MathJax
                    }
                }

                if (mathElm.length > 0 && editingMathElm.length == 0) {
                    //if caret in math area and status is not editing,
                    //move caret out equation
                    var range, sel = rangy.getSelection();
                    range = rangy.createRange();
                    var mathNodeHtml;
                    if (editor.moveNext == true) {
                        mathNodeHtml = mathElm[0].nextSibling.nextSibling; //over script tag
                        //console.log(mathNodeHtml);
                        if (mathNodeHtml == null) {
                            mathNodeHtml = mathElm[0].parentNode.nextSibling.firstChild;
                        }
                        //if it is not text node, find first text node in childs
                        if (mathNodeHtml.nodeType != Node.TEXT_NODE) {
                            var childNodes = mathNodeHtml.childNodes;
                            for(var i = 0; i < childNodes.length; i++) {
                                var child = childNodes[i];
                                if (child.nodeType == 3) {
                                    mathNodeHtml = child;
                                    break;
                                }
                            }
                        }
                        //if equation is inline, move over non-width space which put at the following.
                        var moveOverNonWidthSpace = 0;
                        if (mathNodeHtml.nodeType == Node.TEXT_NODE
                            && mathNodeHtml.wholeText.charCodeAt(0) === 8204) {
                            moveOverNonWidthSpace = 1;
                        }
                        range.setStart(mathNodeHtml, moveOverNonWidthSpace);
                        range.setEnd(mathNodeHtml, moveOverNonWidthSpace);
                    } else {
                        mathNodeHtml = mathElm[0].previousSibling;
                        if (mathNodeHtml == null) {
                            mathNodeHtml = mathElm[0].parentNode.previousSibling.lastChild;
                        }
                        //if it is not text node, find last text node in childs
                        if (mathNodeHtml.nodeType != Node.TEXT_NODE) {
                            for(var nodes = mathNodeHtml.childNodes, j = nodes.length; j--;) {
                                var node = nodes[j];
                                if (node.nodeType == 3) {
                                    mathNodeHtml = node;
                                    break;
                                }
                            }
                        }
                        range.setStart(mathNodeHtml, mathNodeHtml.length);
                        range.setEnd(mathNodeHtml, mathNodeHtml.length);
                    }
                    //apply this range to the selection object
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            });

            editor.on('KeyDown', function(e) {
                if (e.key != "Tab" && runQuestionVm.questionFinished) {
                    e.preventDefault();
                    return;
                }

                editor.moveNext = (e.key == "ArrowRight" || e.key == "Right"); //move next. Otherwise, move previous
                editor.endInlineMath = (e.key == ')'); //add zwnj; after ) for inline math on change event
                editor.runMathJax = (e.key == ']') || (e.key == '$'); //process Mathjax when key press is ] or $. For ), use endInlineMath

                //check length limit
                var control_keys = ['Backspace', 'Enter', 'Shift', 'Control', 'Alt', 'CapsLock', 'PageUp', 'PageDown',
                    'End', 'Home', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Delete', 'Left', 'Up', 'Right', 'Down', 'Del'];
                if(control_keys.indexOf(e.key) == -1){
                    //detailVm.initTinyMceWithNoChange = false; //user interacted with editor

                    var chars_with_html = editor.getContent().length;

                    if (runQuestionVm.checkLengthOverLimit(chars_with_html)) {
                        editor.stopPropagation();
                        editor.preventDefault();
                        return false;
                    }
                }

                //insert space before backslash
                //must after check length limit
                if (e.key == '\\'  && !editor.pressSpace) { // is \
                    editor.execCommand('mceInsertContent', false, " \\"); //will call change event again
                    editor.preventDefault();
                    editor.stopPropagation();
                    editor.pressSpace = true; //if press more than one backslash, not insert space before
                    return false;
                }

                //flag for insert space before begin math equation if any in the next time
                editor.pressSpace = (e.key == ' ' || e.key == '\\');
            });
        }
    };

    //check user paste or type content over limit length
    runQuestionVm.checkLengthOverLimit = function (chars_with_html) {
        //limit of column in mySQL 65536 ~ 21844 chars in UTF-8
        //because editor include html tag, ..., so for safe, use it for 20000 chars
        var max_length = 20000;

        if (chars_with_html > max_length){
            runQuestionVm.statusMessage = 'Chiều dài vượt giới hạn!';
            return true;
        } else {
            runQuestionVm.statusMessage = '';
            return false;
        }
    };

    //update essay (description for essay type)
    runQuestionVm.updateEssay = function () {
        if (runQuestionVm.questionFinished) return;

        //clear mathjax compiled script
        var descriptionElm = $('<div />').append(runQuestionVm.essay);
        descriptionElm.find('script').replaceWith(function(){
            var scriptMath = $(this).html().replace("// <![CDATA[", "").replace("// ]]>", "").trim();
            var blockDisplay = $(this).attr('type');
            if (typeof blockDisplay !== "undefined" && blockDisplay=="math/tex; mode=display") {
                scriptMath = '$$' + scriptMath + '$$';
            } else {
                scriptMath = '\\(' + scriptMath + '\\)&amp; zwnj;'; //inline
            }
            return scriptMath;
        });
        descriptionElm.find('.MathJax_SVG_Display, .MathJax_SVG, .editMath').remove();
        var description = descriptionElm.html();
        description = description.replace(/&amp; zwnj;/g,"&zwnj;"); //preserve zero-width non joiner
        description = description.replace(/[\n\t]+/g,""); //remove all newline

        //if length over limit, not save
        if (runQuestionVm.checkLengthOverLimit(description)) {
            return ;
        }

        // var currentPageItem = runQuestionVm.identifyPageItem(runQuestionVm.questionOrder);
        // if (!runQuestionVm.questionsStatus[currentPageItem]['done']) {
        //     //update question status is done
        //     runQuestionVm.questionsStatus[currentPageItem]['done'] = true;
        // }

        runQuestionVm.answers[0].essay = description; //save to loaded question list for user view again if comeback
        var runService = new RunService({examId: runQuestionVm.examId, questionId: runQuestionVm.questionId});
        runService['essay'] = description;

        runQuestionVm.updating++;
        runService.$updateAnswers(function successCallback(response){
            runQuestionVm.updating--;
            runQuestionVm.updateTryTime = 0;
        }, function errorCallback(response){
            console.log('error');
            console.log(response);
            runQuestionVm.updating--;

            runQuestionVm.statusMessage = 'Chưa cập nhật câu trả lời được. Đang gửi lại...';
            if (runQuestionVm.updateTryTime < runQuestionVm.maxTryTime) {
                runQuestionVm.updateTryTime++;
                $timeout(runQuestionVm.updateEssay, 5000);
            }
        });
    };
    //</editor-fold>

    //<editor-fold desc="matching answer">
    //reset selection in matching type question
    runQuestionVm.resetSelectedMatch = function () {
        runQuestionVm.selectedAnswer = -1;
        runQuestionVm.selectedMatch = -1;
    };

    //select answer box
    runQuestionVm.selectAnswer = function(order, $event) {
        //matching type
        if (!runQuestionVm.questionFinished) {
            runQuestionVm.selectedAnswer = order;
            if ($event != null) $event.stopPropagation();

            if (runQuestionVm.processedMatchedPair) {
                //click new one after paring
                runQuestionVm.selectedMatch = -1;
                runQuestionVm.processedMatchedPair = false;
            } else {
                runQuestionVm.paringMatch();
            }
        }
    };

    //select match box
    runQuestionVm.selectMatch = function(id, $event) {
        //matching type
        if (!runQuestionVm.questionFinished) {
            runQuestionVm.selectedMatch = id;
            if ($event != null) $event.stopPropagation();

            if (runQuestionVm.processedMatchedPair) {
                //click new one after paring
                runQuestionVm.selectedAnswer = -1;
                runQuestionVm.processedMatchedPair = false;
            } else {
                runQuestionVm.paringMatch();
            }
        }
    };

    runQuestionVm.processedMatchedPair = false; //flag to know current pair is processed or not
    //do paring
    runQuestionVm.paringMatch = function () {
        if (runQuestionVm.selectedAnswer != -1 &&  runQuestionVm.selectedMatch != -1) {
            //unlink old pair
            for(var order in runQuestionVm.matchedPairArray) {
                // skip loop if the property is from prototype
                if (!runQuestionVm.matchedPairArray.hasOwnProperty(order)) continue;

                if (runQuestionVm.matchedPairArray[order] == runQuestionVm.selectedMatch) {
                    runQuestionVm.matchedPairArray[order] = 0;
                }
            }
            runQuestionVm.matchedPairArray[runQuestionVm.selectedAnswer] = runQuestionVm.selectedMatch;
            runQuestionVm.answers[runQuestionVm.selectedAnswer - 1].matchId = runQuestionVm.selectedMatch; //save to loaded question list for display again if user go back this question
            runQuestionVm.processedMatchedPair = true;
            $timeout(runQuestionVm.drawConnect);

            var runService = new RunService({examId: runQuestionVm.examId, questionId: runQuestionVm.questionId});
            runService['matchedPairArray'] = runQuestionVm.matchedPairArray;

            runQuestionVm.updating++;
            runService.$updateAnswers(function successCallback(response){
                runQuestionVm.updating--;
                runQuestionVm.updateTryTime = 0;
            }, function errorCallback(response){
                console.log('error');
                console.log(response);
                runQuestionVm.updating--;

                runQuestionVm.statusMessage = 'Chưa cập nhật câu trả lời được. Đang gửi lại...';
                if (runQuestionVm.updateTryTime < runQuestionVm.maxTryTime) {
                    runQuestionVm.updateTryTime++;
                    $timeout(runQuestionVm.paringMatch, 5000);
                }
            });
        }
    };

    //draw connect for paired matching
    runQuestionVm.drawConnect = function() {
        if (runQuestionVm.finishPage) return;

        if (runQuestionVm.questionType != 3) return;    //not draw for other question type

        var matchId, answerElm, matchElm, line1Elm, line2Elm, line3Elm, beginX, beginY, endX, endY;
        for(var order in runQuestionVm.matchedPairArray) {
            // skip loop if the property is from prototype
            if (!runQuestionVm.matchedPairArray.hasOwnProperty(order)) continue;

            matchId = runQuestionVm.matchedPairArray[order];

            //get answer box element and line element
            answerElm = angular.element(document.querySelector( '#answer-' + order));
            line1Elm = angular.element(document.querySelector( '#line1-' + order));
            line2Elm = angular.element(document.querySelector( '#line2-' + order));
            line3Elm = angular.element(document.querySelector( '#line3-' + order));

            if (matchId != 0) {
                //get match box element
                matchElm = angular.element(document.querySelector( '#match-' + matchId));

                //calculate the coordinates
                beginX = answerElm.position().left + answerElm.outerWidth();
                beginY = answerElm.position().top + answerElm.outerHeight()/2;

                endX = matchElm.position().left;
                endY = matchElm.position().top + matchElm.outerHeight()/2;

                //draw
                line1Elm.attr('x1', beginX); line1Elm.attr('y1', beginY);
                line1Elm.attr('x2', beginX + 10); line1Elm.attr('y2', beginY);

                line2Elm.attr('x1', beginX + 10); line2Elm.attr('y1', beginY);
                line2Elm.attr('x2', endX - 10); line2Elm.attr('y2', endY);

                line3Elm.attr('x1', endX - 10); line3Elm.attr('y1', endY);
                line3Elm.attr('x2', endX); line3Elm.attr('y2', endY);
            } else {
                //clear link if have
                line1Elm.attr('x1', 0); line1Elm.attr('y1', 0); line1Elm.attr('x2', 0); line1Elm.attr('y2', 0);
                line2Elm.attr('x1',0); line2Elm.attr('y1', 0); line2Elm.attr('x2', 0); line2Elm.attr('y2', 0);
                line3Elm.attr('x1', 0); line3Elm.attr('y1', 0); line3Elm.attr('x2', 0); line3Elm.attr('y2', 0);
            }
        }

        //draw line which is answer key (correct line)
        if (runQuestionVm.showAnswerKey) {
            var n = runQuestionVm.answers.length;
            for(var i=0; i < n; i++) {
                var answer = runQuestionVm.answers[i];
                if (!answer.isRight) {
                    answerElm = angular.element(document.querySelector( '#answer-' + answer.order));
                    matchElm = angular.element(document.querySelector( '#match-' + answer.correctId));

                    line1Elm = angular.element(document.querySelector( '#line1c-' + answer.order));
                    line2Elm = angular.element(document.querySelector( '#line2c-' + answer.order));
                    line3Elm = angular.element(document.querySelector( '#line3c-' + answer.order));

                    beginX = answerElm.position().left + answerElm.outerWidth();
                    beginY = answerElm.position().top + answerElm.outerHeight()/2 + 5;

                    endX = matchElm.position().left;
                    endY = matchElm.position().top + matchElm.outerHeight()/2 + 5;

                    line1Elm.attr('x1', beginX);
                    line1Elm.attr('y1', beginY);
                    line1Elm.attr('x2', beginX + 10);
                    line1Elm.attr('y2', beginY);

                    line2Elm.attr('x1', beginX + 10);
                    line2Elm.attr('y1', beginY);
                    line2Elm.attr('x2', endX - 10);
                    line2Elm.attr('y2', endY);

                    line3Elm.attr('x1', endX - 10);
                    line3Elm.attr('y1', endY);
                    line3Elm.attr('x2', endX);
                    line3Elm.attr('y2', endY);
                }
            }
        }

    };
    //</editor-fold>

    //<editor-fold desc="Doing help">
    runQuestionVm.doingHelp = false;    //flag to know help is doing
    runQuestionVm.hidingQuestion = false;   //flag to enable/disable hiding question for doing help
    runQuestionVm.helpingType = -1; //helping type
    runQuestionVm.doHelp = function (helpType, available, cost) {
        if (runQuestionVm.loadingQuestion || runQuestionVm.closing) return;

        if (runQuestionVm.doingHelp) {
            runQuestionVm.statusMessage = 'Đang xử lý hỗ trợ, vui lòng đợi...';
            return;
        }

        if (available) {
            //do if help is enable

            //some help can not do if remain time is too short
            if (runQuestionVm.localRemainTime <= 5) {
                if (helpType == 0 || helpType==2 || helpType == 3) {
                    runQuestionVm.statusMessage = 'Thời gian còn lại quá ít để thực hiện hỗ trợ này';

                    $timeout(function(){
                        runQuestionVm.statusMessage = '';
                    }, 5000);

                    return;
                }
            }

            runQuestionVm.doingHelp = true;
            runQuestionVm.helpingType = helpType;
            runQuestionVm.statusMessage = 'Đang xử lý hỗ trợ...';
            var myHelpQuestion = RunService.helpQuestion({examId: runQuestionVm.examId, questionId: runQuestionVm.questionId, type: helpType},
                function successCallback(response){
                    runQuestionVm.statusMessage = '';
                    if (response.success) {
                        //display new coin after charge help cost if any
                        if (angular.isDefined(response.coin)) {
                            runQuestionVm.coin = response.coin * 1; //remove 0 padding if have
                        }

                        //if current question is not helped question, just return (nothing to do)
                        if (runQuestionVm.questionId != response.questionId) return;

                        //proccess result depend on help type
                        switch (helpType) {
                            case 0: //reduce selection
                                runQuestionVm.disabledReduceSelection = true;
                                runQuestionVm.remainReduceSelection = response.remainReduceSelection;
                                runQuestionVm.helpReduceSelection(response.reducedAnswers);
                                break;
                            case 1: //increase time
                                //runQuestionVm.bonusTime = response.bonusTime;
                                //runQuestionVm.duration = runQuestionVm.timer + response.bonusTime;
                                //runQuestionVm.loadedQuestionList[runQuestionVm.questionOrder].bonusTime = response.bonusTime;
                                runQuestionVm.remainTime = response.remainTime;
                                runQuestionVm.startPoint = moment();
                                //runQuestionVm.loadedQuestionList[runQuestionVm.questionOrder].remainTime = response.remainTime;
                                runQuestionVm.loadedQuestionList[runQuestionVm.questionOrder].questionFinished = false;
                                runQuestionVm.questionFinished = false;
                                runQuestionVm.stopCountDown(); //for the case, client is time out (user use helps  near end) but server check ok
                                runQuestionVm.calculateCountDown(runQuestionVm.remainTime);
                                runQuestionVm.myCountDown = $timeout(runQuestionVm.runCountDown, 1000);
                                runQuestionVm.remainIncreaseTime = response.remainIncreaseTime;
                                break;
                            case 2: //answer later
                                runQuestionVm.questionFinished = true;
                                runQuestionVm.calculateCountDown(0);
                                runQuestionVm.stopCountDown();
                                runQuestionVm.disabledQuestionAgain = true; //make sure user can not choose question again
                                runQuestionVm.hidingMessage = 'Đã tạm hoãn câu hỏi hiện tại. Hãy chọn câu hỏi khác để thực hiện tiếp!';
                                runQuestionVm.hidingQuestion = true;
                                runQuestionVm.hideQuestionContent();
                                delete runQuestionVm.loadedQuestionList[runQuestionVm.questionOrder];
                                runQuestionVm.remainAnswerLater = response.remainAnswerLater;
                                break;
                            case 3: //save time
                                runQuestionVm.questionFinished = true;
                                runQuestionVm.loadedQuestionList[runQuestionVm.questionOrder].questionFinished = true;
                                if (runQuestionVm.questionsStatus != null) {
                                    var currentPageItem = runQuestionVm.identifyPageItem(runQuestionVm.questionOrder);
                                    runQuestionVm.questionsStatus[currentPageItem].done = true;

                                    var nQ = runQuestionVm.pages.viewFrame.length;
                                    for(var i = 0; i < nQ; i++) {
                                        if (runQuestionVm.pages.viewFrame[i].id == runQuestionVm.questionId) {
                                            runQuestionVm.pages.viewFrame[i].done = true;
                                            break;
                                        }
                                    }
                                }
                                runQuestionVm.savedTime = response.savedTime;
                                runQuestionVm.calculateCountDown(0);
                                runQuestionVm.stopCountDown();
                                if (runQuestionVm.questionAgainCost >= 0
                                    && runQuestionVm.questionAgainCost <= response.coin) {
                                    runQuestionVm.hidingMessage = 'Đã tích lũy thời gian. Hãy chọn câu hỏi khác để thực hiện tiếp hoặc sử dụng quyền hỗ trợ trả lời lại!';
                                } else {
                                    runQuestionVm.hidingMessage = 'Đã tích lũy thời gian. Hãy chọn câu hỏi khác để thực hiện tiếp!';
                                }
                                runQuestionVm.hidingQuestion = true;
                                runQuestionVm.hideQuestionContent();
                                runQuestionVm.remainSaveTime = response.remainSaveTime;
                                break;
                            case 4: //bonus time
                                //runQuestionVm.bonusTime = response.bonusTime;
                                //runQuestionVm.duration = runQuestionVm.timer + response.bonusTime;
                                //runQuestionVm.loadedQuestionList[runQuestionVm.questionOrder].bonusTime = response.bonusTime;
                                runQuestionVm.remainTime = response.remainTime;
                                runQuestionVm.startPoint = moment();
                                //runQuestionVm.loadedQuestionList[runQuestionVm.questionOrder].remainTime = response.remainTime;
                                runQuestionVm.loadedQuestionList[runQuestionVm.questionOrder].questionFinished = false;
                                runQuestionVm.savedTime = response.savedTime;
                                runQuestionVm.questionFinished = false;
                                runQuestionVm.stopCountDown(); //for the case, client is time out (user use helps  near end) but server check ok
                                runQuestionVm.calculateCountDown(runQuestionVm.remainTime);
                                runQuestionVm.myCountDown = $timeout(runQuestionVm.runCountDown, 1000);
                                break;
                            case 5: //question again
                                //runQuestionVm.questionBeginTime = moment.tz(response.questionBeginTime, runQuestionVm.timeZone);
                                //runQuestionVm.bonusTime = response.bonusTime;
                                //runQuestionVm.duration = runQuestionVm.timer + response.bonusTime;
                                runQuestionVm.remainTime = response.remainTime;
                                runQuestionVm.startPoint = moment();
                                //runQuestionVm.deltaTime = 5;
                                runQuestionVm.loadedQuestionList[runQuestionVm.questionOrder].questionBeginTime = response.questionBeginTime;
                                runQuestionVm.loadedQuestionList[runQuestionVm.questionOrder].bonusTime = response.bonusTime;
                                runQuestionVm.loadedQuestionList[runQuestionVm.questionOrder].questionFinished = false;
                                //runQuestionVm.remainTime = response.remainTime;
                                runQuestionVm.questionFinished = false;
                                runQuestionVm.runQuestionAgain();
                                runQuestionVm.remainQuestionAgain = response.remainQuestionAgain;
                                break;
                        }

                        //check help again
                        runQuestionVm.checkHelps();
                    } else {
                        runQuestionVm.statusMessage = response.message;

                        $timeout(function(){
                            runQuestionVm.statusMessage = '';
                        }, 5000);
                    }
                    runQuestionVm.doingHelp = false;
                    runQuestionVm.helpingType = -1;
                }, function errorCallback(response){
                    runQuestionVm.doingHelp = false;
                    runQuestionVm.helpingType = -1;
                    runQuestionVm.statusMessage = '';

                    console.log('error');
                    console.log(response);
                });

            //save request for cancel later when need
            if (runQuestionVm.myCancelableRequests.length >= 500) {
                runQuestionVm.myCancelableRequests.shift();
            }
            runQuestionVm.myCancelableRequests.push(myHelpQuestion);
        } else {
            //display message to inform why is not available
            if (cost >= 0 && runQuestionVm.coin <= cost && runQuestionVm.localRemainTime > 0 && helpType != 4) { //not for bonus time
                runQuestionVm.statusMessage = 'Không đủ xu để thực hiện';

                $timeout(function(){
                    runQuestionVm.statusMessage = '';
                }, 5000);
            }
        }
    };

    //do help reduce selection
    runQuestionVm.helpReduceSelection = function (reducedAnswers) {
        switch (runQuestionVm.questionType) {
            case 0: //single choice
            case 1: //multiple choice
                //data must be array
                if (reducedAnswers.length == 0) {
                    return;
                }
                var nAnswer = runQuestionVm.answers.length;
                for(var i= nAnswer - 1; i >= 0; i--) { //must in reserve order because splice function change index
                    var answer = runQuestionVm.answers[i];
                    if (reducedAnswers.indexOf(answer.id) !== -1) {
                        runQuestionVm.answers.splice(i, 1);
                    }
                }

                //reset select
                if (runQuestionVm.questionType == 0) {
                    //single choice
                    runQuestionVm.selectedRadio = -1;
                } else {
                    //multiple choice
                    for(var checkboxId in runQuestionVm.selectedCheckbox) {
                        // skip loop if the property is from prototype
                        if (!runQuestionVm.selectedCheckbox.hasOwnProperty(checkboxId)) continue;

                        runQuestionVm.selectedCheckbox[checkboxId] = false;
                    }
                }

                break;
            case 2: //essay
                break;
            case 3: //matching
                var matchId;
                for (var key in reducedAnswers) {
                    // skip loop if the property is from prototype
                    if (!reducedAnswers.hasOwnProperty(key)) continue;

                    matchId = reducedAnswers[key];
                    console.log(key);
                    console.log(matchId);
                    console.log(runQuestionVm.answers);
                    runQuestionVm.answers[key - 1].matchId = matchId; //save to loaded question list for display again if user go back this question
                }
                runQuestionVm.matchedPairArray = reducedAnswers;
                $timeout(function() {
                    runQuestionVm.drawConnect();
                });
                break;
        }
    };

    //hide question content because question have not been done yet, user can answer again. So data must be hided
    runQuestionVm.hideQuestionContent = function() {
        runQuestionVm.hidedSectionDescription = runQuestionVm.sectionDescription;
        runQuestionVm.hidedQuestionDescription = runQuestionVm.questionDescription;
        runQuestionVm.hidedAnswers = runQuestionVm.answers;
        runQuestionVm.sectionDescription = '';
        runQuestionVm.questionDescription = '';
        runQuestionVm.answers = [];
    };

    //do question again help
    runQuestionVm.runQuestionAgain = function () {
        if (runQuestionVm.hidingQuestion) {
            runQuestionVm.sectionDescription = runQuestionVm.hidedSectionDescription;
            runQuestionVm.questionDescription = runQuestionVm.hidedQuestionDescription;
            runQuestionVm.answers = runQuestionVm.hidedAnswers;

            //refresh mathjax equation
            $timeout(function(){
                MathJax.Hub.Queue(['Typeset', MathJax.Hub], function () {
                    runQuestionVm.refreshAfterMathjax();
                });
            }, 0);
        }

        //scroll window to top
        $window.scrollTo(0, 0);

        runQuestionVm.showQuestion = true;
        runQuestionVm.hidingQuestion = false;
        runQuestionVm.loadingQuestion = false;

        runQuestionVm.showAnswerKey = false;

        runQuestionVm.stopCountDown();
        runQuestionVm.myCountDown = $timeout(runQuestionVm.runCountDown,1000);
    };
    //</editor-fold>

    //callback function when url is changed by javascript
    $scope.$on('$locationChangeSuccess', function (event, current, previous) {
        //this is how your track of the navigation history
        if (current == previous) return;

        var searchObject = $location.search();

        if (angular.isDefined(searchObject['order'])) {
            //go to question if it is not finish page
            var order = searchObject['order'];
            runQuestionVm.changeQuestion(order);
        } else {
            //finish exam after user is agree to finish exam
            if (angular.isDefined(searchObject['confirmed']) && searchObject['confirmed'] == 1) {
                runQuestionVm.finishExam();
            }
        }
    });

    //go to other question
    runQuestionVm.changeQuestion = function (order) {
        if (order < 1 || order > runQuestionVm.numberQuestion || runQuestionVm.questionsStatus == null) {
            return;
        }

        runQuestionVm.questionOrder = order; //change to new order after close old question

        if (angular.isUndefined(runQuestionVm.loadedQuestionList[order])) {
            //load question directly because question have not been loaded yet.
            var currentPageItem = runQuestionVm.identifyPageItem(order);
            var questionId = runQuestionVm.questionsStatus[currentPageItem].id;
            var myRequestLoad = RunService.loadQuestion({examId: runQuestionVm.examId, questionId: questionId}, function successCallback(response){
                if (response.success) {
                    var order = response.questionData.order;
                    runQuestionVm.loadedQuestionList[order] = response.questionData;
                    runQuestionVm.loadQuestion(response.questionData);
                    $timeout(runQuestionVm.preLoadQuestions);
                }

            }, function errorCallback(response){
                console.log('error');
                console.log(response);
            });

            if (runQuestionVm.myCancelableRequests.length >= 500) {
                runQuestionVm.myCancelableRequests.shift();
            }
            runQuestionVm.myCancelableRequests.push(myRequestLoad);
        } else {
            //get question in loaded question list and request decrypt key if any
            var questionData = runQuestionVm.loadedQuestionList[order];
            switch (questionData.status) {
                case 0: //question is finished or creator is trying exam
                    runQuestionVm.loadQuestion(questionData);
                    $timeout(runQuestionVm.preLoadQuestions);
                    break;
                case 1: //content is encrypted
                    //connect server to know: begin time, remain time, encrypt key 1
                    var runService = new RunService({examId: runQuestionVm.examId, questionId: questionData.id});
                    runService['encryptKey1'] = questionData.encryptKey1;
                    runService['iv'] = questionData.iv;
                    runService.$decryptQuestion(function successCallback(response){
                        if (response.success) {
                            runQuestionVm.loadedQuestionList[order].status = 0;
                            runQuestionVm.loadedQuestionList[order].examFinished = response.data.examFinished;
                            runQuestionVm.loadedQuestionList[order].questionFinished = response.data.questionFinished;
                            //runQuestionVm.loadedQuestionList[order].questionBeginTime = response.data.questionBeginTime;
                            runQuestionVm.loadedQuestionList[order].remainTime = response.data.remainTime;
                            runQuestionVm.decryptQuestion(order, response.data.encryptKey, response.data.iv);
                            runQuestionVm.loadQuestion(runQuestionVm.loadedQuestionList[order]);
                            $timeout(runQuestionVm.preLoadQuestions);
                        }

                    }, function errorCallback(response) {
                        console.log('error');
                        console.log(response);
                    });
                    break;
            }
        }
    };

    runQuestionVm.medalLevel = 0;      //user's medal in exam result after finish exam
    runQuestionVm.score = '';           //user's score
    runQuestionVm.examResult = null;    //exam result
    //do finish exam
    runQuestionVm.finishExam = function () {
        runQuestionVm.questionOrder = runQuestionVm.numberQuestion + 1;
        runQuestionVm.currentOrder = runQuestionVm.finishOrder;

        runQuestionVm.hidingQuestion = false;
        if (runQuestionVm.examFinished && runQuestionVm.examResult != null) {
            //result exam is loaded before, so just get old data without request for result
            runQuestionVm.loadingQuestion = false;
            runQuestionVm.loadingIcon = false;
            runQuestionVm.finishPage = true;
            return;
        }

        runQuestionVm.loadingQuestion = true;

        //request finish exam
        var runService = new RunService({examId : runQuestionVm.examId});
        runService.$finishExam(function successCallback(response) {
            console.log(response);
            if (response.success) {
                runQuestionVm.hidingQuestion = false;
                runQuestionVm.loadingQuestion = false;
                runQuestionVm.loadingIcon = false;
                runQuestionVm.finishPage = true;

                runQuestionVm.questionFinished = true;
                runQuestionVm.examFinished = true;

                runQuestionVm.calculateCountDown(0);
                runQuestionVm.stopCountDown();
                runQuestionVm.countDownMode = 3; //non-display

                runQuestionVm.checkHelps();

                $window.scrollTo(0, 0);

                runQuestionVm.examResult = response.examResult;
                runQuestionVm.prepareResultChart(response.examResult);
            }
        }, function errorCallback(response){
            console.log('error');
            console.log(response);
        });
    };

    //display charts
    runQuestionVm.correctChart = null;  //chart about number questions is correct
    runQuestionVm.consumedTimeChart = null; //chart about consumed time
    runQuestionVm.scoreChart = null;    //chart about score
    //init result chart
    runQuestionVm.initResultChart = function () {
        runQuestionVm.correctChart = {
            'labels': ['Đúng', 'Sai'],
            'colors': ['#00E676', '#DCDCDC'],
            'data': []
        };

        runQuestionVm.consumedTimeChart = {
            'labels': ['Thời gian sử dụng', 'Còn lại'],
            'colors': ['#00ADF9', '#DCDCDC'],
            'data': []
        };

        runQuestionVm.scoreChart = {
            'labels': ['Mức đạt', 'Mức chưa đạt'],
            'colors': ['#803690', '#DCDCDC'],
            'data': []
        };
    };

    runQuestionVm.socialshare_description = "";
    runQuestionVm.socialshare_quote = "";
    runQuestionVm.socialshare_caption = new Date().toJSON().slice(0,10);
    runQuestionVm.socialshare_media = "";
    //extract some chart value from exam result data
    runQuestionVm.prepareResultChart = function (resultData) {
        runQuestionVm.score = (resultData.score * 1).toString();

        runQuestionVm.correctChart.data = [resultData.numberCorrect, resultData.totalQuestion - resultData.numberCorrect];
        runQuestionVm.consumedTimeChart.data = [resultData.consumedTime,
            Math.max(0, resultData.totalTime - resultData.consumedTime)];
        runQuestionVm.scoreChart.data = [resultData.score, Math.max(0, resultData.totalScore - resultData.score)];

        var correctRate = (resultData.numberCorrect)/resultData.totalQuestion;
        var consumedTimeRate = (resultData.consumedTime)/resultData.totalTime;
        var scoreRate = (resultData.score)/resultData.totalScore;

        runQuestionVm.medalLevel = 0;
        runQuestionVm.medalText = "";
        runQuestionVm.medalImg = "medal0.jpg";
        if (correctRate == 1 && scoreRate == 1) {
            runQuestionVm.medalLevel = 5;
            runQuestionVm.medalText = "HC vàng";
            runQuestionVm.medalImg = "medal5.jpg";
        } else if (correctRate >= 0.8 && scoreRate >= 0.8) {
            runQuestionVm.medalLevel = 4;
            runQuestionVm.medalText = "HC bạc";
            runQuestionVm.medalImg = "medal4.jpg";
        } else if (correctRate >= 0.6 && scoreRate >= 0.6 && consumedTimeRate <= 0.9) {
            runQuestionVm.medalLevel = 3;
            runQuestionVm.medalText = "HC đồng";
            runQuestionVm.medalImg = "medal3.jpg";
        } else if (correctRate >= 0.3 && scoreRate >= 0.3) {
            runQuestionVm.medalLevel = 2;
            runQuestionVm.medalText = "HC sắt";
            runQuestionVm.medalImg = "medal2.jpg";
        } else if (correctRate > 0 && scoreRate > 0) {
            runQuestionVm.medalLevel = 1;
            runQuestionVm.medalText = "HC nhựa";
            runQuestionVm.medalImg = "medal1.jpg";
        }

        runQuestionVm.socialshare_media = "https://toithi.com/images/medal/" + runQuestionVm.medalImg;
        runQuestionVm.socialshare_quote = "Link đề: https://toithi.com/exam/" + runQuestionVm.examId + "/information";
        runQuestionVm.socialshare_description = "Chúc mừng bạn đã hoàn thành bài thi với "
            + runQuestionVm.medalText + '. '
            + 'Điểm đạt được: ' + runQuestionVm.score + '. '
            + 'Số câu đúng: ' + resultData.numberCorrect + '. '
            + 'Thời gian thực hiện: ' + Math.round(resultData.consumedTime/60) + ' phút. ';
    };

    runQuestionVm.loadingIcon = false;  //flag to know whether display or not loading icon
    runQuestionVm.displayLoadingIcon = function () {
        //fading loading few a time (while loading question). After about 5s, if question is unloaded, display waiting icon
        runQuestionVm.loadingIcon = true;
        $scope.$digest();
    };

    //user change to other question
    runQuestionVm.goToQuestion = function (order) {
        if ((order != runQuestionVm.finishOrder) &&
            (order < 1 || order > runQuestionVm.numberQuestion || order == runQuestionVm.currentOrder)) {
            return;
        }

        //if question status is not load, just return
        if (runQuestionVm.questionsStatus == null) {
            runQuestionVm.statusMessage = 'Đang chuẩn bị câu hỏi mới';
            $timeout(function(){
                runQuestionVm.statusMessage = '';
            }, 3000);

            return;
        }
        runQuestionVm.statusMessage = '';

        var currentLocation;
        var parameters;
        if (order == runQuestionVm.finishOrder) {

            if (runQuestionVm.finishPage) return;

            if (runQuestionVm.examFinished) {
                //exam is finished, just change to finish page
                runQuestionVm.loadingQuestion = true;
                runQuestionVm.loadingOrder = 'HT';

                //change url path (finish page will be loaded in change path callback function)
                currentLocation = $location.path();
                currentLocation = currentLocation.substr(0, currentLocation.lastIndexOf('/') + 1) + 'finish';
                parameters = {'confirmed': 1};
                if (runQuestionVm.backPage == 'edit') {
                    parameters['trying'] = 1;
                }
                $location.path(currentLocation).search(parameters);
            } else {
                //exam is unfinished, so must ask question for agree with finish exam
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'confirmFinishModal.html',
                    controller: 'confirmFinishCtrl',
                    controllerAs: 'confirmFinishVm',
                    keyboard: true,
                    size: null
                });

                modalInstance.result.then(function (confirm){
                    if (confirm == true) {
                        runQuestionVm.loadingQuestion = true;
                        runQuestionVm.loadingOrder = 'HT';
                        if (runQuestionVm.questionFinished) {
                            //Notes: the following code does not put same block of closequestion function.
                            // It means user must wait question is close before finish exam because statistic may be called before close question
                            var currentLocation = $location.path();
                            currentLocation = currentLocation.substr(0, currentLocation.lastIndexOf('/') + 1) + 'finish';
                            var parameters = {'confirmed': 1};
                            if (runQuestionVm.backPage == 'edit') {
                                parameters['trying'] = 1;
                            }
                            $location.path(currentLocation).search(parameters);
                        } else {
                            runQuestionVm.closeQuestion();
                        }
                    }
                });
            }
        } else {
            runQuestionVm.loadingQuestion = true;
            runQuestionVm.loadingOrder = order;

            //close current question
            runQuestionVm.closeQuestion();

            var currentPageItem = runQuestionVm.identifyPageItem(order);
            if(angular.isUndefined(runQuestionVm.questionsStatus[currentPageItem])) return;

            var questionId = runQuestionVm.questionsStatus[currentPageItem].id;
            if (questionId == null) return;

            //change url path (question will loaded on change path callback event)
            currentLocation = $location.path();
            currentLocation = currentLocation.substr(0, currentLocation.lastIndexOf('/') + 1) + questionId;
            parameters = {'order': order};
            if (runQuestionVm.backPage == 'edit') {
                parameters['trying'] = 1;
            }
            $location.path(currentLocation).search(parameters);
        }

    };

    //user click next button (right side) to go other question
    runQuestionVm.goNext = function () {
        if (runQuestionVm.questionOrder < runQuestionVm.numberQuestion) {
            runQuestionVm.goToQuestion(runQuestionVm.questionOrder + 1);
        } else {
            runQuestionVm.goToQuestion(runQuestionVm.finishOrder);
        }
    };

    //user click previous button (left side) to go other question
    runQuestionVm.goPrevious = function () {
        if (runQuestionVm.questionOrder > 1) {
            runQuestionVm.goToQuestion(runQuestionVm.questionOrder - 1);
        }
    };

    //user pause question doing
    runQuestionVm.exit = function () {
        runQuestionVm.hidingMessage = 'Đang dừng đề thi...';
        runQuestionVm.hidingQuestion = true;

        //close current question
        runQuestionVm.closeQuestion();

        runQuestionVm.questionFinished = true; //must after close question
        runQuestionVm.closing = true;

        $timeout(function() {
            runQuestionVm.cancelAllRequests();
            if (runQuestionVm.backPage == 'edit') {
                $window.location.href = '/u/exam/' + runQuestionVm.examId + '/edit';
            } else {
                $window.location.href = '/u/exam/' + runQuestionVm.examId + '/dashboard/show';
            }

        }, 1000);

    };

    //go to page manager (button in finish page)
    runQuestionVm.goToPageManager = function () {
        //go to page manager in finish page
        runQuestionVm.cancelAllRequests();
        if (runQuestionVm.backPage == 'edit') {
            $window.location.href = '/u/exam/' + runQuestionVm.examId + '/edit';
        } else {
            $window.location.href = '/u/exam/' + runQuestionVm.examId + '/dashboard/show';
        }
    };

    //cancel all unfinished request
    runQuestionVm.myCancelableRequests = [];
    runQuestionVm.cancelAllRequests = function () {
        //to use $cancelRequest, object must be instance of Resource class, not is promise
        //and $resource service must be set cancellable option to true
        var n = runQuestionVm.myCancelableRequests.length;
        for(var i=0; i < n; i++) {
            runQuestionVm.myCancelableRequests[i].$cancelRequest();
        }
    };

    runQuestionVm.shortcutKey = function () {
        $uibModal.open({
            animation: true,
            templateUrl: 'shortcutKeyModal.html',
            controller: 'shortcutKeyCtrl',
            controllerAs: 'shortcutKeyVm',
            keyboard: true,
            size: 'lg'
        });

    };

    runQuestionVm.pressingCtrlAlt = false;

    $scope.$on('keydown', function(evt, obj){
        console.log(obj);

        $scope.$apply(function () {
            runQuestionVm.pressingCtrlAlt = obj.ctrlKey && obj.altKey;
        });

        if (runQuestionVm.questionFinished && !runQuestionVm.examFinished
            && obj.ctrlKey && obj.altKey && obj.key == 'l') {
            $scope.$apply(function () {
                runQuestionVm.doHelp(5, runQuestionVm.isHelpQuestionAgain, runQuestionVm.questionAgainCost); //question again
            });
            return;
        }

        if ((obj.key == 'ArrowRight' || obj.key == 'Right') && obj.ctrlKey && obj.altKey) {
            $scope.$apply(function () {
                runQuestionVm.goNext();
            });
            return;
        }

        if ((obj.key == 'ArrowLeft' || obj.key == 'Left') && obj.ctrlKey && obj.altKey) {
            $scope.$apply(function () {
                runQuestionVm.goPrevious();
            });
            return;
        }

        if (runQuestionVm.questionFinished || runQuestionVm.examFinished) return;

        if (obj.ctrlKey && obj.altKey) {
            var helpType = -1;
            var isAvailable = false;
            var cost = 0;
            switch (obj.key) {
                case 'g':
                    helpType = 0; //reduce selection
                    isAvailable = runQuestionVm.isHelpReduceSelection;
                    cost = runQuestionVm.reduceSelectionCost;
                    break;
                case 't':
                    helpType = 1; //increase time
                    isAvailable = runQuestionVm.isHelpIncreaseTime;
                    cost = runQuestionVm.increaseTimeCost;
                    break;
                case 's':
                    helpType = 2; //answer later
                    isAvailable = runQuestionVm.isHelpAnswerLater;
                    cost = runQuestionVm.answerLaterCost;
                    break;
                case 'i':
                    helpType = 3; //save time
                    isAvailable = runQuestionVm.isHelpSaveTime;
                    cost = runQuestionVm.saveTimeCost;
                    break;
                case 'x':
                    helpType = 4; //bonus time
                    isAvailable = runQuestionVm.isHelpTime;
                    cost = 0;
                    break;
            }
            if (helpType != -1) {
                $scope.$apply(function () {
                    runQuestionVm.doHelp(helpType, isAvailable, cost);
                });
            }
            return;
        }

        var selectedOrder = null;
        var answerId = null;

        var matchSelection = false;
        if (obj.key >= '1' && obj.key <= '9') {
            selectedOrder = parseInt(obj.key);
            matchSelection = true;
        } else {
            selectedOrder = parseInt(obj.key, 36) - 9;//convert alphabet to order based 1
        }

        var nAnswer = runQuestionVm.answers.length;
        for(var i=0; i < nAnswer; i++) {
            if (runQuestionVm.answers[i].order == selectedOrder) {
                answerId = runQuestionVm.answers[i].id;
                break;
            }
        }

        if (answerId == null) return;

        $scope.$apply(function () {
            switch (runQuestionVm.questionType) {
                case 0: //single choice
                    runQuestionVm.selectedRadio = answerId;
                    break;
                case 1: //multiple choice
                    runQuestionVm.selectedCheckbox[answerId] = !runQuestionVm.selectedCheckbox[answerId];
                    break;
                case 2: //essay
                    break;
                case 3: //matching
                    if (matchSelection) {
                        runQuestionVm.selectMatch(answerId, null)
                    } else {
                        runQuestionVm.selectAnswer(selectedOrder, null);
                    }
                    break;
            }
        });
    });

    $scope.$on('keyup', function(evt, obj){
        $scope.$apply(function () {
            runQuestionVm.pressingCtrlAlt = false;
        });
    });

}]);
mainApp.controller('confirmExportCtrl', ['$scope', '$uibModalInstance', 'userData', function($scope, $uibModalInstance, userData){
    var confirmExportVm = this; //view's model for detail controller
    confirmExportVm.coin = userData.coin;
    confirmExportVm.exportFee = userData.exportFee;

    confirmExportVm.agree = function (isAgree) {
        $uibModalInstance.close(isAgree);
    };
}]);
mainApp.controller('deleteAllUserExamCtrl', ['$scope', '$uibModalInstance', 'StatisticService', 'exam', function($scope, $uibModalInstance, StatisticService, exam){
    var deleteAllUserExamVm = this;
    deleteAllUserExamVm.examId = exam.examId;
    deleteAllUserExamVm.password = null;
    deleteAllUserExamVm.message = '';

    deleteAllUserExamVm.cancel = function () {
        $uibModalInstance.close(false);
    };

    deleteAllUserExamVm.changePassword = function () {
        deleteAllUserExamVm.message = '';
    };

    deleteAllUserExamVm.deleting = false;
    deleteAllUserExamVm.delete = function () {
        if (deleteAllUserExamVm.password == null || deleteAllUserExamVm.password.length < 8) {
            return;
        }

        deleteAllUserExamVm.deleting = true;

        StatisticService.deleteAllUserExam({examId: deleteAllUserExamVm.examId}, {password: deleteAllUserExamVm.password}, function successCallback(response) {
            deleteAllUserExamVm.deleting = false;

            console.log(response);
            if (response.success) {
                $uibModalInstance.close(true);
            } else {
                deleteAllUserExamVm.message = response.message;
            }
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            deleteAllUserExamVm.deleting = false;
        })
    };

}]);
mainApp.controller('deleteUserExamCtrl', ['$scope', '$uibModalInstance', 'StatisticService', 'userExam', function($scope, $uibModalInstance, StatisticService, userExam){
    var deleteUserExamVm = this;
    deleteUserExamVm.examId = userExam.examId;
    deleteUserExamVm.user = userExam.user;
    deleteUserExamVm.message = '';

    deleteUserExamVm.cancel = function () {
        $uibModalInstance.close(false);
    };

    deleteUserExamVm.deleting = false;
    deleteUserExamVm.delete = function () {
        deleteUserExamVm.deleting = true;
        console.log(deleteUserExamVm.user);

        StatisticService.deleteUserExam({examId: deleteUserExamVm.examId, userId: deleteUserExamVm.user.id}, {}, function successCallback(response) {
            deleteUserExamVm.deleting = false;

            if (response.success) {
                $uibModalInstance.close(true);
            } else {
                deleteUserExamVm.message = response.message;
            }
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            deleteUserExamVm.deleting = false;
        })
    };

}]);
mainApp.controller('modifyMarkCtrl', ['$scope', '$uibModalInstance', 'StatisticService', 'question', function($scope, $uibModalInstance, StatisticService, question){
    var modifyMarkVm = this; //view's model for detail controller
    modifyMarkVm.question = question;
    modifyMarkVm.newMark = 0;
    modifyMarkVm.message = '';

    modifyMarkVm.cancel = function () {
        $uibModalInstance.close({
            updated: false
        });
    };

    modifyMarkVm.validMark = false;
    modifyMarkVm.update = function (isValid) {
        modifyMarkVm.validMark = isValid;
    };

    modifyMarkVm.modifying = false;
    modifyMarkVm.finish = function () {
        if (modifyMarkVm.validMark) {
            modifyMarkVm.modifying = true;
            modifyMarkVm.newMark = Math.round(modifyMarkVm.newMark  * 1000) / 1000;
            var data = {
                'userId': modifyMarkVm.question.userId,
                'questionId': modifyMarkVm.question.questionId,
                'currentMark': modifyMarkVm.question.currentMark * 1,
                'newMark': modifyMarkVm.newMark

            };
            StatisticService.updateMark({examId: modifyMarkVm.question.examId}, data, function successCallback(response) {
                modifyMarkVm.modifying = false;

                if (response.success) {
                    $uibModalInstance.close({
                        updated: true,
                        newMark: modifyMarkVm.newMark
                    });
                } else {
                    modifyMarkVm.message = response.message;
                }
            }, function errorCallback(response) {
                console.log('error');
                console.log(response);
                modifyMarkVm.modifying = false;
            })
        }
    };

}]);
mainApp.controller('refreshUserExamCtrl', ['$scope', '$uibModalInstance', 'StatisticService', 'userExam', function($scope, $uibModalInstance, StatisticService, userExam){
    var refreshUserExamVm = this;
    refreshUserExamVm.examId = userExam.examId;
    refreshUserExamVm.user = userExam.user;
    refreshUserExamVm.message = '';

    refreshUserExamVm.cancel = function () {
        $uibModalInstance.close({
            'refreshed': false
        });
    };

    refreshUserExamVm.refreshing = false;
    refreshUserExamVm.refresh = function () {
        refreshUserExamVm.refreshing = true;

        StatisticService.refreshUserExam({examId: refreshUserExamVm.examId, userId: refreshUserExamVm.user.id}, {}, function successCallback(response) {
            refreshUserExamVm.refreshing = false;

            if (response.success) {
                $uibModalInstance.close({
                    'refreshed': true
                });
            } else {
                refreshUserExamVm.message = response.message;
            }
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            refreshUserExamVm.refreshing = false;
        })
    };

}]);
mainApp.controller('resultCtrl', ['$scope', '$timeout', '$window', '$location', '$sce', '$uibModal', 'Fullscreen', 'StatisticService', function($scope, $timeout, $window, $location, $sce, $uibModal, Fullscreen, StatisticService){
    var resultVm = this;
    resultVm.display = 'general';
    resultVm.displayQuestion = 0;

    resultVm.numFinishedUsers = null;
    resultVm.init = function(data) {
        console.log(data);
        resultVm.creatorId = data.creatorId;
        resultVm.examId = data.examId;

        resultVm.coin = data.coin;
        resultVm.exportFee = data.exportFee;
        resultVm.exportPaid = false;
        resultVm.exportDate = null;
        resultVm.timezone = data.timezone;
        if (data.statistic != null) {
            resultVm.exportLink = data.statistic.export_link;
            resultVm.shortedExportLink = resultVm.exportLink.length > 0 ? Math.random().toString(36).substring(7)
                + '/' + resultVm.exportLink.split('/').pop() : '';
            if (data.statistic.export_paid_date != null) {
                var exportDate = moment.tz(data.statistic.export_paid_date, resultVm.timezone);
                resultVm.exportDate = exportDate.format('DD/MM/YYYY');
                var now = moment({hour: 0}).tz(resultVm.timezone);
                var interval = now.diff(exportDate, 'days');
                resultVm.exportPaid = (interval == 0 && data.statistic.export_paid);
            }
        }

        var hash = $location.hash();
        if (hash == 'general' || hash == 'question' || hash == 'time' || hash == 'scoreboard' || hash == 'export') {
            resultVm.changeDisplayPage(hash);
        }
        //init result chart variables
        resultVm.initResultChart();

        //display last done result
        resultVm.loadStatisticData(data);

        //load exam data (include questions, answers)
        $timeout(resultVm.loadExamContent);

        //load users data
        $timeout(resultVm.loadUserData);

        //check update

        //resultVm.loadResults();
    };

    //display charts
    resultVm.correctChart = null;  //chart about number questions is correct
    resultVm.colors = ['#45b7cd', '#ff6384', '#ff8e72'];

    //init result chart
    resultVm.initResultChart = function () {
        resultVm.correctChart = {
            'labels': ['Đúng', 'Sai'],
            'colors': ['#82C00B', '#d40000'],
            'data': []
        };

        resultVm.scoreRangeLabel = [];

        resultVm.scoreRangeData = [];

        resultVm.datasetOverride = [
            {
                label: "Số người",
                borderWidth: 1,
                type: 'bar'
            },
            {
                label: "Miền",
                borderWidth: 3,
                hoverBackgroundColor: "rgba(255,99,132,0.4)",
                hoverBorderColor: "rgba(255,99,132,1)",
                type: 'line'
            }
        ];
    };

    resultVm.loadStatisticData = function (data) {
        if (data.statistic == null) {
            $timeout(resultVm.analysisExam);
        } else {
            resultVm.displayStatisticData(data.statistic);

            //check again for update
            $timeout(resultVm.analysisExam());
        }
    };

    resultVm.updatedAt = null;
    resultVm.displayStatisticData = function (statistic) {
        console.log('display statistic data');
        console.log(statistic);
        resultVm.numFinishedUsers = statistic.num_finished_users;
        if (statistic.num_finished_users == 0) {
            resultVm.correctChart.data = [];
            resultVm.scoreRangeLabel = [];
            resultVm.scoreRangeData = [];
            resultVm.numCorrectPerQuestion = [];
            resultVm.numDoPerQuestion = [];
            resultVm.numSelectionPerAnswer = [];
            resultVm.userTimerPerQuestion = [];
        } else {
            resultVm.correctChart.data = [statistic.correct_percent, 100 - statistic.correct_percent];

            resultVm.scoreRangeLabel = angular.fromJson(statistic.score_range_label);
            var scoreRangeData = angular.fromJson(statistic.score_range_data);
            resultVm.scoreRangeData = [scoreRangeData, scoreRangeData];

            resultVm.numCorrectPerQuestion = angular.fromJson(statistic.num_correct_per_question);
            resultVm.numDoPerQuestion = angular.fromJson(statistic.num_do_per_question);
            resultVm.numSelectionPerAnswer = angular.fromJson(statistic.num_selection_per_answer);
            //resultVm.timerPerQuestion = angular.fromJson(statistic.time_per_question);
            resultVm.userTimerPerQuestion = angular.fromJson(statistic.consumed_time_per_question);
        }

        resultVm.updatedAt = statistic.updated_at;
    };

    resultVm.analyzingExam = false;
    resultVm.analysisExam = function () {
        if (resultVm.analyzingExam == true) return;

        resultVm.analyzingExam = true;
        StatisticService.analysis({examId: resultVm.examId}, function successCallback(response) {
            //resultVm.loadingResults = false;
            console.log(response);

            if (response.success) {
                resultVm.displayStatisticData(response.statistic);
            }
            resultVm.analyzingExam = false;
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            //resultVm.loadingResults = false;
            resultVm.analyzingExam = false;
        });
    };

    resultVm.loadExamContentService = null;
    resultVm.loadingExamContent = false;
    resultVm.examData = null;
    resultVm.loadExamContent = function () {
        if (resultVm.loadingExamContent == true) return;

        resultVm.loadingExamContent = true;
        resultVm.loadExamContentService = StatisticService.loadExamContent({examId: resultVm.examId}, function successCallback(response) {
            if (response.success) {
                resultVm.examData = response.content;
                resultVm.timerPerQuestion = response.timePerQuestion;
            }
            resultVm.loadingExamContent = false;
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            resultVm.loadingExamContent = false;
        });
    };

    resultVm.loadUsersDataService = null;
    resultVm.usersData = [];
    resultVm.currentUsersDataPage = 0;
    resultVm.nextPageUrl = null;
    resultVm.loadingUsersData = false;
    resultVm.loadUserData = function () {
        if (resultVm.loadingUsersData == true ||
            (resultVm.nextPageUrl == null && resultVm.currentUsersDataPage != 0)) {
            return;
        }

        resultVm.loadingUsersData = true;
        resultVm.loadUsersDataService = StatisticService.loadUsersData({examId: resultVm.examId, page: resultVm.currentUsersDataPage + 1}, function successCallback(response) {
            if (response.success
                && resultVm.currentUsersDataPage + 1 == response.results.current_page) {
                if (response.results.data.length > 0) {
                    resultVm.usersData = resultVm.usersData.concat(response.results.data);
                }
                resultVm.currentUsersDataPage++;
                resultVm.nextPageUrl = response.results.next_page_url;
                console.log(resultVm.usersData);
            }
            resultVm.loadingUsersData = false;
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            resultVm.loadingUsersData = false;
        });
    };

    resultVm.doAnalysisExamAgain = function () {
        if (resultVm.analyzingExam || resultVm.loadingUsersData || resultVm.loadingExamContent) {
            return;
        }

        resultVm.analysisExam();

        resultVm.viewedTimeQuestions = [];
        resultVm.viewedStatisticQuestions = [];
        resultVm.examData = null;
        resultVm.loadExamContent();

        resultVm.viewedDetailScoreboards = [];
        resultVm.viewedScoreboards = [];
        resultVm.currentUser = null;
        resultVm.usersData = [];
        resultVm.currentUsersDataPage = 0;
        resultVm.nextPageUrl = null;
        resultVm.loadUserData();
    };

    // resultVm.loadingResults = false;
    // resultVm.loadResultsService = null;
    // resultVm.loadResults = function () {
    //     resultVm.loadingResults = true;
    //     resultVm.loadResultsService = StatisticService.loadResults({examId: resultVm.examId}, function successCallback(response) {
    //         resultVm.loadingResults = false;
    //         console.log(response);
    //
    //         if (response.success) {
    //             resultVm.correctChart.data = [response.result.correctPercent, 100 - response.result.correctPercent];
    //
    //             resultVm.scoreRangeLabel = response.result.scoreRangeLabel;
    //             resultVm.scoreRangeData = [response.result.scoreRangeData, response.result.scoreRangeData];
    //
    //             resultVm.examData = response.result.examData;
    //             resultVm.numCorrectPerQuestion = response.result.numCorrectPerQuestion;
    //             resultVm.numDoPerQuestion = response.result.numDoPerQuestion;
    //             resultVm.numSelectionPerAnswer = response.result.numSelectionPerAnswer;
    //             resultVm.timerPerQuestion = response.result.timerPerQuestion;
    //             resultVm.userTimerPerQuestion = response.result.userTimerPerQuestion;
    //
    //             resultVm.usersData = response.result.usersData;
    //
    //             resultVm.loadMoreQuestion();
    //             resultVm.loadMoreQuestionTime();
    //             resultVm.loadMoreQuestionTime();
    //             resultVm.loadMoreScoreboardDetail();
    //
    //             $window.scrollTo(0, 0);
    //
    //             $timeout(function() {
    //                 resultVm.updateWindowScroll(resultVm.display);
    //             });
    //         }
    //     }, function errorCallback(response) {
    //         console.log('error');
    //         console.log(response);
    //         resultVm.loadingResults = false;
    //     })
    // };

    resultVm.viewedStatisticQuestions = [];
    resultVm.displayMoreQuestion = function () {
        console.log('load more question');
        if (resultVm.viewedStatisticQuestions.length >= resultVm.examData.items.length) return;

        var n = Math.min(resultVm.viewedStatisticQuestions.length + 40, resultVm.examData.items.length);

        for (var i = resultVm.viewedStatisticQuestions.length; i < n; i++) {
            resultVm.viewedStatisticQuestions.push(resultVm.examData.items[i]);
        }
    };

    resultVm.viewedTimeQuestions = [];
    resultVm.displayMoreQuestionTime = function () {
        if (resultVm.viewedTimeQuestions.length >= resultVm.examData.items.length) return;

        var n = Math.min(resultVm.viewedTimeQuestions.length + 20, resultVm.examData.items.length);

        for (var i = resultVm.viewedTimeQuestions.length; i < n; i++) {
            resultVm.viewedTimeQuestions.push(resultVm.examData.items[i]);
        }
    };

    resultVm.viewedScoreboards = [];
    resultVm.displayMoreScoreboard = function () {
        if (resultVm.viewedScoreboards.length + 40 >= resultVm.usersData.length) {
            resultVm.loadUserData(); //load next page
        }

        if (resultVm.viewedScoreboards.length >= resultVm.usersData.length) return;

        var n = Math.min(resultVm.viewedScoreboards.length + 20, resultVm.usersData.length);

        var creatorIdx = -1;
        for (var i = resultVm.viewedScoreboards.length; i < n; i++) {
            if (resultVm.usersData[i].id == resultVm.creatorId) {
                creatorIdx = i;
                continue;
            }

            resultVm.viewedScoreboards.push(resultVm.usersData[i]);
        }

        //remove creator out of list
        if (creatorIdx != -1) {
            resultVm.usersData.splice(creatorIdx, 1);
        }
    };

    resultVm.viewedDetailScoreboards = [];
    resultVm.displayMoreScoreboardDetail = function () {
        if (resultVm.viewedDetailScoreboards.length >= resultVm.examData.items.length) return;

        var n = Math.min(resultVm.viewedDetailScoreboards.length + 20, resultVm.examData.items.length);

        for (var i = resultVm.viewedDetailScoreboards.length; i < n; i++) {
            resultVm.viewedDetailScoreboards.push(resultVm.examData.items[i]);
        }
    };

    resultVm.getCorrectPercentOnQuestion = function (questionId) {
        if (resultVm.numDoPerQuestion != null
            && resultVm.numCorrectPerQuestion != null
            && angular.isDefined(resultVm.numDoPerQuestion[questionId])
            && angular.isDefined(resultVm.numCorrectPerQuestion[questionId])
            && resultVm.numDoPerQuestion[questionId]!= 0) {
            return (((resultVm.numCorrectPerQuestion[questionId]/resultVm.numDoPerQuestion[questionId]) * 100).toFixed(2) * 1).toString();
        } else {
            return 0;
        }
    };

    resultVm.getNumberCorrectOnQuestion = function (questionId) {
        if (resultVm.numCorrectPerQuestion != null && angular.isDefined(resultVm.numCorrectPerQuestion[questionId])) {
            return resultVm.numCorrectPerQuestion[questionId];
        } else return 0;
    };

    resultVm.getNumberIncorrectOnQuestion = function (questionId) {
        if (resultVm.numDoPerQuestion != null && angular.isDefined(resultVm.numDoPerQuestion[questionId])) {
            if (resultVm.numCorrectPerQuestion != null && angular.isDefined(resultVm.numCorrectPerQuestion[questionId])) {
                return resultVm.numDoPerQuestion[questionId] - resultVm.numCorrectPerQuestion[questionId];
            } else {
                return resultVm.numDoPerQuestion[questionId];
            }
        } else return 0;
    };

    resultVm.displayAnswerDescription = function (answer, questionType) {
        var str = '';
        var checked = answer.is_right ? 'checked' : '';
        var style = answer.is_right ? 'style="color:#14c508; font-weight: 500;"' : '';
        switch (questionType) {
            case 0: //single choice type
                str = '<div class="form-check" ' + style + '>'
                        + '<label class="form-check-label">'
                            + '<input type="radio" class="form-check-input" name="' + answer.id + '" ' + checked + ' disabled> '
                                + answer.description
                        + '</label>'
                    + '</div>';
                break;
            case 1: //multiple choice type
                str = '<div class="form-check"' + style + '>'
                        + '<label class="form-check-label">'
                            + '<input type="checkbox" class="form-check-input" name="' + answer.id + '" ' + checked + ' disabled> '
                            + answer.description
                        + '</label>'
                    + '</div>';
                break;
            case 2: //essay type
                str = '<div>'+ answer.description + '</div>';
                break;
            case 3: //matching type
                str = '<div class="row">'
                        + '<div class="col-5">'
                            + '<div>'
                            +  answer.description
                            + '</div>'
                        + '</div>'
                        + '<div class="col-2">'
                            + '<hr>'
                        + '</div>'
                        + '<div class="col-5">'
                            + '<div>'
                            +  answer.match
                            + '</div>'
                        + '</div>'
                    + '</div>';
                break;
            default:
                str = answer.description;
        }

        return $sce.trustAsHtml(str);
    };

    resultVm.getSelectionPercentAnswer = function (answerId, questionId) {
        if (resultVm.numSelectionPerAnswer != null
            && resultVm.numDoPerQuestion != null
            && angular.isDefined(resultVm.numSelectionPerAnswer[answerId])
            && angular.isDefined(resultVm.numDoPerQuestion[questionId])) {
            return (((resultVm.numSelectionPerAnswer[answerId]/resultVm.numDoPerQuestion[questionId]) * 100).toFixed(2) * 1).toString();
        } else return 0;
    };

    resultVm.getNumberSelectionAnswer = function (answerId) {
        if (resultVm.numSelectionPerAnswer != null
            && angular.isDefined(resultVm.numSelectionPerAnswer[answerId])) {
            return resultVm.numSelectionPerAnswer[answerId];
        } else return 0;
    };

    resultVm.getTimePercentOnQuestion = function (questionId) {
        if (resultVm.timerPerQuestion != null
            && resultVm.userTimerPerQuestion != null
            && resultVm.numDoPerQuestion != null
            && angular.isDefined(resultVm.userTimerPerQuestion[questionId])
            && angular.isDefined(resultVm.timerPerQuestion[questionId]) && resultVm.timerPerQuestion[questionId] > 0
            && angular.isDefined(resultVm.numDoPerQuestion[questionId]) && resultVm.numDoPerQuestion[questionId] > 0) {
            return (resultVm.userTimerPerQuestion[questionId]/(resultVm.numDoPerQuestion[questionId] * resultVm.timerPerQuestion[questionId])) * 100;
        } else {
            return 0;
        }
    };

    resultVm.getTimeOnQuestion = function (questionId) {
        if (resultVm.numDoPerQuestion != null
            && resultVm.userTimerPerQuestion != null
            && angular.isDefined(resultVm.userTimerPerQuestion[questionId])
            && angular.isDefined(resultVm.numDoPerQuestion[questionId]) && resultVm.numDoPerQuestion[questionId] > 0) {
            return Math.round(resultVm.userTimerPerQuestion[questionId]/resultVm.numDoPerQuestion[questionId]) + ' giây';
        } else {
            return '-';
        }
    };

    resultVm.scrollPosCache = {};
    resultVm.changeDisplayPage = function (pageLabel) {
        resultVm.scrollPosCache[resultVm.display] = [$window.pageXOffset, $window.pageYOffset];

        resultVm.display = pageLabel;
        $location.hash(pageLabel);

        $timeout(function() {
            resultVm.updateWindowScroll(pageLabel);
        });
    };

    resultVm.getUserMarkOnQuestion = function (questionId) {
        return (resultVm.currentUser['questionsMark'][questionId] * 1).toString();
    };
    
    resultVm.displayUserAnswerDescription = function (answer, questionType) {
        var str = '';
        var checked = answer.is_right ? 'checked' : '';
        var style = answer.is_right ? 'style="color:#14c508; font-weight: 500;"' : '';
        switch (questionType) {
            case 0: //single choice type
                str = '<div class="form-check" ' + style + '>'
                    + '<label class="form-check-label">'
                    + '<input type="radio" class="form-check-input" name="' + answer.id + '" ' + checked + ' disabled> '
                    + answer.description
                    + '</label>'
                    + '</div>';
                break;
            case 1: //multiple choice type
                str = '<div class="form-check"' + style + '>'
                    + '<label class="form-check-label">'
                    + '<input type="checkbox" class="form-check-input" name="' + answer.id + '" ' + checked + ' disabled> '
                    + answer.description
                    + '</label>'
                    + '</div>';
                break;
            case 2: //essay type
                str = '<div>'+ answer.description + '</div>';
                break;
            case 3: //matching type
                str = '<div class="row">'
                        + '<div class="col-9">'
                            + '<div>'
                                +  answer.description
                            + '</div>'
                        + '</div>'
                        + '<div class="col-3">'
                            + '<hr>'
                        + '</div>'
                    + '</div>';
                break;
            default:
                str = answer.description;
        }

        return $sce.trustAsHtml(str);
    };

    resultVm.currentUser = null;
    resultVm.loadUserDetailService = null;
    resultVm.loadingUserDetail = false;
    resultVm.displayUserDetail = function (user) {
        resultVm.currentUser = user;
        resultVm.scoreboardView = 'scoreboard-detail';

        if (resultVm.currentUser.loadDetail) {
            $timeout(function() {
                resultVm.updateWindowScroll('scoreboard');
            });
        } else {
            resultVm.loadingUserDetail = true;
            resultVm.loadUserDetailService = StatisticService.loadUserDetail({examId: resultVm.examId, userId: user.id}, function successCallback(response) {
                resultVm.loadingUserDetail = false;

                if (response.success) {
                    resultVm.currentUser.loadDetail = true;
                    resultVm.currentUser.questionsMark = response.user.questionsMark;
                    resultVm.currentUser.answers = response.user.answers;

                    $window.scrollTo(0, 0);

                    $timeout(function() {
                        resultVm.updateWindowScroll('scoreboard');
                    });
                }
            }, function errorCallback(response) {
                console.log('error');
                console.log(response);
                resultVm.loadingUserDetail = false;
            })
        }

    };

    resultVm.deleteUserExam = function (userIndex, user) {
        var deleteUserExamModalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'deleteUserExamModal.html',
            controller: 'deleteUserExamCtrl',
            controllerAs: 'deleteUserExamVm',
            keyboard: true,
            resolve: {
                userExam: function () {
                    return {
                        'examId': resultVm.examId,
                        'user': user
                    }
                }
            }
        });

        deleteUserExamModalInstance.result.then(function (deleted){
            if (deleted) {
                resultVm.usersData.splice(userIndex, 1);
                resultVm.viewedScoreboards.splice(userIndex, 1);
            }
        });

    };

    resultVm.refreshUserExam = function (userIndex, user) {
        if (user.pivot.begin_time == null) return;

        var refreshUserExamModalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'refreshUserExamModal.html',
            controller: 'refreshUserExamCtrl',
            controllerAs: 'refreshUserExamVm',
            keyboard: true,
            resolve: {
                userExam: function () {
                    return {
                        'examId': resultVm.examId,
                        'userIndex': userIndex,
                        'user': user
                    }
                }
            }
        });

        refreshUserExamModalInstance.result.then(function (response){
            if (response.refreshed) {
                resultVm.usersData[userIndex].loadDetail = false;
                resultVm.usersData[userIndex].pivot.score = 0;
                resultVm.usersData[userIndex].pivot.begin_time = null;
                resultVm.usersData[userIndex].pivot.consumed_time = 0;
                resultVm.usersData[userIndex].pivot.number_correct = 0;
                resultVm.usersData[userIndex].pivot.finished = false;
                delete resultVm.usersData[userIndex].questionsMark;
                delete resultVm.usersData[userIndex].answers;

                resultVm.viewedScoreboards[userIndex].loadDetail = false;
                resultVm.viewedScoreboards[userIndex].pivot.score = 0;
                resultVm.viewedScoreboards[userIndex].pivot.begin_time = null;
                resultVm.viewedScoreboards[userIndex].pivot.consumed_time = 0;
                resultVm.viewedScoreboards[userIndex].pivot.number_correct = 0;
                resultVm.viewedScoreboards[userIndex].pivot.finished = false;
                delete resultVm.viewedScoreboards[userIndex].questionsMark;
                delete resultVm.viewedScoreboards[userIndex].answers;
            }
        });

    };

    resultVm.terminateUserExam = function (userIndex, user) {
        if(user.pivot.finished) return;

        var refreshUserExamModalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'terminateUserExamModal.html',
            controller: 'terminateUserExamCtrl',
            controllerAs: 'terminateUserExamVm',
            keyboard: true,
            resolve: {
                userExam: function () {
                    return {
                        'examId': resultVm.examId,
                        'user': user
                    }
                }
            }
        });

        refreshUserExamModalInstance.result.then(function (response){
            if (response.terminated) {
                resultVm.usersData[userIndex].loadDetail = false;
                resultVm.usersData[userIndex].pivot.score = response.data.score;
                resultVm.usersData[userIndex].pivot.begin_time = response.data.beginTime;
                resultVm.usersData[userIndex].pivot.consumed_time = response.data.consumedTime;
                resultVm.usersData[userIndex].pivot.number_correct = response.data.numberCorrect;
                resultVm.usersData[userIndex].pivot.finished = true;
                delete resultVm.usersData[userIndex].questionsMark;
                delete resultVm.usersData[userIndex].answers;

                resultVm.viewedScoreboards[userIndex].loadDetail = false;
                resultVm.viewedScoreboards[userIndex].pivot.score = response.data.score;
                resultVm.viewedScoreboards[userIndex].pivot.begin_time = response.data.beginTime;
                resultVm.viewedScoreboards[userIndex].pivot.consumed_time = response.data.consumedTime;
                resultVm.viewedScoreboards[userIndex].pivot.number_correct = response.data.numberCorrect;
                resultVm.viewedScoreboards[userIndex].pivot.finished = true;
                delete resultVm.viewedScoreboards[userIndex].questionsMark;
                delete resultVm.viewedScoreboards[userIndex].answers;
            }
        });
    };

    resultVm.deletingAllUserExam = false;
    resultVm.deleteAllUserExam = function () {
        resultVm.deletingAllUserExam = true;
        var deleteAllUserExamModalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'deleteAllUserExamModal.html',
            controller: 'deleteAllUserExamCtrl',
            controllerAs: 'deleteAllUserExamVm',
            keyboard: true,
            resolve: {
                exam: function () {
                    return {
                        'examId': resultVm.examId
                    }
                }
            }
        });

        deleteAllUserExamModalInstance.result.then(function (deleteAll){
            if (deleteAll) {
                resultVm.usersData = [];
                resultVm.viewedScoreboards = [];
            }
            resultVm.deletingAllUserExam = false;
        });
    };

    resultVm.scoreboardView = 'scoreboard-list';
    resultVm.displayScoreboard = function (pageStr) {
        resultVm.scoreboardView = pageStr;

        $timeout(function() {
            resultVm.updateWindowScroll('scoreboard');
        });
    };

    resultVm.displayUserAnswerSelection = function (question, answerId) {
        var str = '-';
        switch (question.questionType) {
            case 0: //single choice type
                if (resultVm.currentUser['answers'][question.questionId][answerId]['pivot']['is_selected']) {
                    str = '<i class="fa fa-circle" aria-hidden="true"></i>';
                }
                break;
            case 1: //multiple choice type
                if (resultVm.currentUser['answers'][question.questionId][answerId]['pivot']['is_selected']) {
                    str = '<i class="fa fa-square" aria-hidden="true"></i>';
                }
                break;
            case 2: //essay type
                if (resultVm.currentUser['answers'][question.questionId][answerId]['pivot']['essay'] != null) {
                    str = resultVm.currentUser['answers'][question.questionId][answerId]['pivot']['essay'];
                }
                break;
            case 3: //matching type
                if (resultVm.currentUser['answers'][question.questionId][answerId]['pivot']['match_id'] != 0) {
                    str = resultVm.currentUser['answers'][question.questionId][answerId]['match'];
                }
                break;
            default:
                str = '-';
        }
        return $sce.trustAsHtml(str);
    };

    resultVm.checkUserAnswer = function (question, answerId) {
        var str = '';
        switch (question.questionType) {
            case 0: //single choice type
            case 1: //multiple choice type
                if (resultVm.currentUser['answers'][question.questionId][answerId]['pivot']['is_selected']) {
                    if (resultVm.currentUser['answers'][question.questionId][answerId]['correct']) {
                        str = '<span class="text-success"><i class="fa fa-check" aria-hidden="true"></i></span>';
                    } else {
                        str = '<span class="text-danger"><i class="fa fa-close" aria-hidden="true"></i></span>';
                    }
                }
                break;
            case 2: //essay type
                if (resultVm.currentUser['answers'][question.questionId][answerId]['pivot']['essay'] != null) {
                    if (resultVm.currentUser['answers'][question.questionId][answerId]['correct']) {
                        str = '<span class="text-success"><i class="fa fa-check" aria-hidden="true"></i></span>';
                    } else {
                        str = '<span class="text-danger"><i class="fa fa-close" aria-hidden="true"></i></span>';
                    }
                }
                break;
            case 3: //matching type
                if (resultVm.currentUser['answers'][question.questionId][answerId]['pivot']['match_id'] != 0) {
                    if (resultVm.currentUser['answers'][question.questionId][answerId]['correct']) {
                        str = '<span class="text-success"><i class="fa fa-check" aria-hidden="true"></i></span>';
                    } else {
                        str = '<span class="text-danger"><i class="fa fa-close" aria-hidden="true"></i></span>';
                    }
                }
                break;
            default:
                str = '';
        }
        return $sce.trustAsHtml(str);
    };

    resultVm.isFullScreen = false;
    resultVm.goFullScreen = function () {
        if (Fullscreen.isEnabled()) {
            Fullscreen.cancel();
            resultVm.isFullScreen = false;
        }
        else {
            Fullscreen.all();
            resultVm.isFullScreen = true;
        }
    };

    resultVm.updateWindowScroll = function (pageLabel) {
        switch (pageLabel) {
            case 'question':
                resultVm.fixTableHeaderWhenScrollOut('question-table', 'fixed-question-table');
                break;
            case 'time':
                resultVm.fixTableHeaderWhenScrollOut('time-table', 'fixed-time-table');
                break;
            case 'scoreboard':
                if(resultVm.scoreboardView == 'scoreboard-list') {
                    resultVm.fixTableHeaderWhenScrollOut('scoreboard-table', 'fixed-scoreboard-table');
                } else {
                    resultVm.fixTableHeaderWhenScrollOut('detail-scoreboard-table', 'fixed-detail-scoreboard-table');
                }
                break;
        }

        var prevScrollPos = resultVm.scrollPosCache[pageLabel] || [0, 0];
        $window.scrollTo(prevScrollPos[0], prevScrollPos[1]);
    };

    resultVm.fixTableHeaderWhenScrollOut = function (fixedTableId, pseudoHeaderId) {
        var fixedTable = document.querySelector('#' + fixedTableId);
        if (fixedTable == null) return;

        var fixedTableElm = angular.element(fixedTable);
        var tableOffset = fixedTableElm.offset().top;

        var $header = angular.element(fixedTableElm[0].querySelector('thead'));
        var $fixedHeader = angular.element(document.querySelector('#' + pseudoHeaderId));

        var existHeader = $fixedHeader[0].querySelector('thead');
        if (existHeader == null) {
            $fixedHeader.append($header.clone());
        }

        resultVm.myWindow.off("scroll.fixHeader"); //unbind old scroll event
        resultVm.myWindow.on("scroll.fixHeader", function() {
            var offset = $window.pageYOffset + 55;

            if (offset >= tableOffset) {
                $fixedHeader.show();

                $timeout(function () {
                    angular.forEach($header.find('tr > th'), function(value, key){
                        var original_width = angular.element(value).outerWidth();
                        var original_padding = angular.element(value).css("padding");
                        angular.element($fixedHeader.find('tr > th')[key])
                            .outerWidth(original_width)
                            .css("padding",original_padding);
                    });
                });
            }
            else {
                $fixedHeader.hide();
            }
        });
    };

    //detect window size change and update question list and draw matching link
    resultVm.myWindow = angular.element($window); // wrap window object as jQuery object
    resultVm.myWindow.on('resize', function() {
        resultVm.myWindow.trigger('scroll');

        // don't forget manually trigger $digest()
        $scope.$digest();
    });

    $scope.$on('$locationChangeSuccess', function (event, current, previous) {
        //scroll window to top after change hash/url
        //$window.scrollTo(0, 0);

        //compare after remove hash
        if (current.split('#')[0] == previous.split('#')[0]) return;

        // if (resultVm.loadResultsService != null) {
        //     resultVm.loadResultsService.$cancelRequest();
        // }

        if (resultVm.loadExamContentService != null) {
            resultVm.loadExamContentService.$cancelRequest();
        }

        if (resultVm.exportStatisticsService != null) {
            resultVm.exportStatisticsService.$cancelRequest();
        }

        if (resultVm.loadUsersDataService != null) {
            resultVm.loadUsersDataService.$cancelRequest();
        }

        if (resultVm.loadUserDetailService != null) {
            resultVm.loadUserDetailService.$cancelRequest();
        }
    });

    resultVm.modifyUserMark = function (order, questionId) {
        if (!resultVm.currentUser.pivot.finished) return;

        var currentMark = resultVm.currentUser['questionsMark'][questionId];
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'modifyMarkModal.html',
            controller: 'modifyMarkCtrl',
            controllerAs: 'modifyMarkVm',
            keyboard: true,
            size: 'sm',
            resolve: {
                question: function () {
                    return {
                        'order': order,
                        'currentMark': currentMark,
                        'examId': resultVm.examId,
                        'userId': resultVm.currentUser.id,
                        'questionId': questionId
                    }
                }
            }
        });

        modalInstance.result.then(function (response){
            if (response.updated) {
                resultVm.currentUser.pivot.score = Math.max(0, resultVm.currentUser.pivot.score - currentMark + response.newMark);
                resultVm.currentUser['questionsMark'][questionId] = response.newMark;
            }
        });
    };

    resultVm.exportLink = '';
    resultVm.shortedExportLink = '';
    resultVm.exportPaid = false;
    resultVm.exportMessage = '';
    resultVm.exportOptions = {
        general: true,
        question: true,
        answer: true,
        time: true,
        scoreboard: true,
        progress_bar: false
    };
    resultVm.exportFee = 2;
    resultVm.exporting = false;
    resultVm.exportStatisticsService = null;
    resultVm.exportExcel = function () {
        if (resultVm.exporting || resultVm.analyzingExam) return;

        if (resultVm.coin < resultVm.exportFee) {
            resultVm.exportMessage = 'Bạn không đủ xu để thực hiện';
        } else {
            if (resultVm.exportPaid) {
                resultVm.doExport();
            } else {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'confirmExportModal.html',
                    controller: 'confirmExportCtrl',
                    controllerAs: 'confirmExportVm',
                    keyboard: true,
                    resolve: {
                        userData: function () {
                            return {
                                'coin': resultVm.coin,
                                'exportFee': resultVm.exportFee
                            }
                        }
                    }
                });

                modalInstance.result.then(function (confirm){
                    if (confirm) {
                        resultVm.doExport();
                    }
                });
            }
        }
    };

    resultVm.doExport = function () {
        resultVm.exporting = true;

        resultVm.exportStatisticsService = StatisticService.exportStatistics({examId: resultVm.examId}, resultVm.exportOptions, function successCallback(response) {
            if (response.success) {
                resultVm.exportPaid = true;
                resultVm.coin = response.newCoin;
                resultVm.exportLink = response.exportLink;
                resultVm.shortedExportLink = response.exportLink.length > 0 ? Math.random().toString(36).substring(7)
                    + '/' +  response.exportLink.split('/').pop() : '';
                var now = moment({hour: 0}).tz(resultVm.timezone);
                resultVm.exportDate = now.format('DD/MM/YYYY');
            } else {
                resultVm.exportMessage = response.message;
            }
            resultVm.exporting = false;
        }, function errorCallback(respone) {
            console.log('error');
            console.log(respone);
            resultVm.exportMessage = 'Lỗi kết xuất';
            resultVm.exporting = false;
        });
    };
}]);
mainApp.controller('terminateUserExamCtrl', ['$scope', '$uibModalInstance', 'StatisticService', 'userExam', function($scope, $uibModalInstance, StatisticService, userExam){
    var terminateUserExamVm = this;
    terminateUserExamVm.examId = userExam.examId;
    terminateUserExamVm.user = userExam.user;
    terminateUserExamVm.message = '';

    terminateUserExamVm.cancel = function () {
        $uibModalInstance.close({
            'terminated': false
        });
    };

    terminateUserExamVm.terminating = false;
    terminateUserExamVm.terminate = function () {
        terminateUserExamVm.terminating = true;

        StatisticService.terminateUserExam({examId: terminateUserExamVm.examId, userId: terminateUserExamVm.user.id}, {}, function successCallback(response) {
            terminateUserExamVm.terminating = false;

            console.log(response);
            if (response.success) {
                $uibModalInstance.close({
                    'terminated': true,
                    'data': response.data
                });
            } else {
                terminateUserExamVm.message = response.message;
            }
        }, function errorCallback(response) {
            console.log('error');
            console.log(response);
            terminateUserExamVm.terminating = false;
        })
    };

}]);
angular.element(document).ready(function() {
    angular.bootstrap(document, ['mainApp']);
});
//# sourceMappingURL=all.js.map
