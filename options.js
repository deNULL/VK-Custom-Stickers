function checkAccessToken() {
  ge('block_auth').style.display = opts.accessToken ? 'none' : 'block';
  ge('block_logged').style.display = opts.accessToken ? 'block' : 'none';
  ge('block_settings').style.display = opts.accessToken ? 'block' : 'none';

  if (opts.accessToken) {
    
    api('users.get', {}, function(data) {
      saveOptions({ userID: data.response[0].id, firstName: data.response[0].first_name, lastName: data.response[0].last_name });

      ge('link_user').href = 'http://vk.com/id' + opts.userID;
      ge('link_user').innerHTML = opts.firstName + ' ' + opts.lastName;
    });
    api('photos.getAlbums', { owner_id: -69762228 }, function(data) {
      var albums = data.response.items;
      var html = [];
      var defs = {};
      for (var i = 0; i < albums.length; i++) {
        defs['album' +  + albums[i].id] = false;
      }
      loadOptions(defs);
      for (var i = 0; i < albums.length; i++) {
        html.push('<div style="margin: 12px" id="check_album' + albums[i].id + '" class="checkbox' + (opts['album' + albums[i].id] ? ' on' : '') + '"><div></div><span>' + albums[i].title + '</span></div>');
      }
      ge('list_albums').innerHTML = html.join('');
      for (var i = 0; i < albums.length; i++) {
        check('album' + albums[i].id, 'album' + albums[i].id);
      }
    });
  }
}

function performAuth() {
  var redirect_uri = 'https://oauth.vk.com/blank.html';
  var redirect_regex = /^https:\/\/oauth.vk.com\/blank.html#(.*)$/i;
  chrome.windows.getCurrent(function(wnd) {
    chrome.tabs.getCurrent(function(tab) {
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
              checkAccessToken();
            }
          }
        });
      });
    });
  });
}

function radiobtn(c, onclick) {
  var radio = document.getElementsByClassName('radiobtn ' + c);
  var handler = function(e) {
    for (var i = 0; i < radio.length; i++) {
      if (radio[i] == this) {
        radio[i].classList.add('on');
      } else {
        radio[i].classList.remove('on');
      }
    }
    onclick.call(this, e, this.id);
  }
  for (var i = 0; i < radio.length; i++) {
    radio[i].onclick = handler;
  }
}

ge('button_auth').onclick = performAuth;
ge('button_close').onclick = function() {
  window.close();
}
ge('link_logout').onclick = function() {
  saveOptions({ accessToken: false });
  checkAccessToken();
  return false;
}

function check(id, opt) {
  var ch = ge('check_' + id);
  if (opts[opt]) {
    ch.classList.add('on');
  }
  ch.onclick = function(e) {
    this.classList.toggle('on');
    var update = {};
    update[opt] = this.classList.contains('on');
    saveOptions(update);
  }
}

checkAccessToken();