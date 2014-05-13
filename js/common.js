function ge(e) {
  return document.getElementById(e);
}
function geByClass(c, n) {
  return Array.prototype.slice.call((n || document).getElementsByClassName(c));
}

var opts = {};
function loadOptions(defaults) {
  for (var key in defaults) {
    var item = kango.storage.getItem(key);
    try {
      opts[key] = item !== null ? JSON.parse(item) : defaults[key];
    } catch (e) {
      opts[key] = defaults[key];
    }
  }
}
function saveOptions(update, silent) {
  if (update) {
    for (var key in update) {
      opts[key] = update[key];
      kango.storage.setItem(key, JSON.stringify(update[key]));
    }
  }
  if (!silent) {
    kango.dispatchMessage('updateOptions', {update: update});
  }
}

function api(method, params, callback) {
  var arr = [];
  
  params.v = '5.7';
  params.access_token = opts.accessToken;

  for (var k in params) {
    arr.push(k + '=' + escape(params[k]));
  }
  params.sig = MD5('/method/' + method + '?' + unescape(arr.join('&')) + opts.secret);

  var alertError = function(error) {
    console.log(error);
    var notification = kango.ui.notifications.createNotification(
      'Ошибка ' + error.error_code + ' при выполнении запроса «' + method + '»',
      'Произошла ошибка «' + error.error_msg + ' при обращении к API ВКонтакте. Сообщите разработчику.',
      'icons/icon48.png'
    );

    notification.addEventListener(notification.event.CLICK, function () {
      window.open('http://vk.com/write189814');
      notification.removeEventListener(notification.event.CLICK);
      notification.close();
    });

    notification.show();
    setTimeout(function() {
      notification.removeEventListener(notification.event.CLICK);
      notification.close();
    }, 5000);
  };

  var showAuthNotification = function () {
    var notification = kango.ui.notifications.createNotification(
      'Пожалуйста, авторизуйтесь',
      'Для работы расширения «VK Custom Stickers» необходима авторизация.',
      'icons/icon48.png'
    );

    notification.addEventListener(notification.event.CLICK, function () {
      kango.browser.tabs.create({url:'options.html'});
      notification.removeEventListener(notification.event.CLICK);
      notification.close();
    });

    notification.show();
    setTimeout(function() {
      notification.removeEventListener(notification.event.CLICK);
      notification.close();
    }, 10000);
  };

  var details = {
    method: 'POST',
    url: 'https://api.vk.com/method/' + method,
    async: true,
    params: params,
    contentType: 'json'
  };

  kango.xhr.send(details, function(data) {
    if (data.status == 200 && data.response !== null) {
      if (data.response.error) {
        if (data.response.error.error_code === 10) {
          showAuthNotification();
        } else {
          alertError(data.response.error);
        }
      } else {
        callback(data.response);
      }
    }
  });
}

function apiRequestString(method, params) {
  return 'API.' + method + '(' + JSON.stringify(params) + ')';
}

function init() {
  loadOptions({
    accessToken: false,
    secret: false,
    firstName: false,
    lastName: false,
    userID: false,
    albums: [192747081, 192764999]
  });
}

if (window.KangoAPI) {
  KangoAPI.onReady(init);
} else {
  init();
}
