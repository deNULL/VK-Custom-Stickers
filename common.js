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
    opts[key] = localStorage[key] ? JSON.parse(localStorage[key]) : defaults[key];
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
        var notification = window.webkitNotifications.createNotification(
          'icon-48.png',
          'Ошибка ' + res.error.error_code + ' при выполнении запроса «' + method + '»',
          'Произошла ошибка «' + res.error.error_msg + ' при обращении к API ВКонтакте. Сообщите разработчику.'
        );

        notification.onclick = function () {
          window.open('http://vk.com/write189814');
          notification.close();
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