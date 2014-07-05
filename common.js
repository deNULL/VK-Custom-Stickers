function ge(e) {
  return document.getElementById(e);
}
function geByClass(c, n) {
  return Array.prototype.slice.call((n || document).getElementsByClassName(c));
}
function geByClass1(c, n) {
  return (n || document).getElementsByClassName(c)[0];
}

var opts = {};
function loadOptions(defaults) {
  for (var key in defaults) {
    opts[key] = opts[key] || defaults[key];
  }
  for (var key in localStorage) {
    try {
      opts[key] = JSON.parse(localStorage[key]);
    } catch (e) {
    }
  }
}
function saveOptions(update, silent) {
  if (update) {
    for (var key in update) {
      opts[key] = update[key];
      localStorage[key] = JSON.stringify(update[key]);
    }
  }
  if (!silent) {
    chrome.extension.sendRequest({ method: 'updateOptions', update: update });
  }
}
loadOptions({
  accessToken: false,
  secret: false,
  firstName: false,
  lastName: false,
  userID: false,

  album192747081: true,
  album192764999: true
});

function performAuth() {
  var redirect_uri = 'https://oauth.vk.com/blank.html';
  var redirect_regex = /^https:\/\/oauth.vk.com\/blank.html#(.*)$/i;
  chrome.windows.getCurrent(function(wnd) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.windows.create({
        url: 'https://oauth.vk.com/authorize?client_id=4301512&scope=messages,photos,offline,nohttps&redirect_uri=' + redirect_uri + '&display=popup&v=5.7&response_type=token',
        tabId: tab.id,
        focused: true,
        type: 'popup',
        left: wnd.left + (wnd.width - 700) >> 1,
        top: wnd.top + (wnd.height - 500) >> 1,
        width: 700,
        height: 500,
      }, function(popup) {
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
          var match;
          if (tab.windowId == popup.id && changeInfo.url && (match = changeInfo.url.match(redirect_regex))) {
            chrome.windows.remove(popup.id);

            var params = match[1].split('&');
            var map = {};
            for (var i = 0; i < params.length; i++) {
              var kv = params[i].split('=');
              map[kv[0]] = kv[1];
            }


            if (map['access_token']) {
              saveOptions({ accessToken: map['access_token'], secret: map['secret'] });
              console.log('access_token: ', map['access_token'], 'secret:', map['secret']);
              if (window.checkAccessToken) {
                checkAccessToken();
              }
            }
          }
        });
      });
    });
  });
}

function api(method, params, callback) {
  var arr = ['v=5.7', 'access_token=' + opts.accessToken];
  for (var k in params) {
    arr.push(k + '=' + escape(params[k]));
  }
  arr.push('sig=' + MD5('/method/' + method + '?' + unescape(arr.join('&')) + opts.secret));

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (this.readyState == 4 && this.status == 200) {
      var res = (typeof this.response == 'string') ? JSON.parse(this.response) : this.response;
      if (!callback(res) && res.error) {
        if ((res.error.error_code == 10) || (res.error.error_code == 13) || (res.error.error_code == 5)) {
          var notification = window.webkitNotifications.createNotification(
            'icon-48.png',
            'Расширению «VK Custom Stickers» требуется авторизация',
            'Для использования дополнительных стикеров нужно разрешить доступ. Щелкните здесь чтобы авторизоваться.'
          );
          notification.onclick = function() {
            performAuth();
            notification.close();
          }
        } else {
          var notification = window.webkitNotifications.createNotification(
            'icon-48.png',
            'Ошибка ' + res.error.error_code + ' при выполнении запроса «' + method + '»',
            'Произошла ошибка «' + res.error.error_msg + ' при обращении к API ВКонтакте. Сообщите разработчику.'
          );
          notification.onclick = function () {
            window.open('http://vk.com/write189814');
            notification.close();
          }
        }

        notification.show();
        setTimeout(function() {
          notification.cancel();
        }, 5000);
      }
    }
  }
  xhr.open('POST', 'https://api.vk.com/method/' + method);
  xhr.responseType = 'json';
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send(arr.join('&'));
}

