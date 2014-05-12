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
    var photosCalls = [];
    for (var i = 0; i < 24; i++) {
      photosCalls.push('API.photos.getAll({ owner_id: -69762228, offset: ' + (i * 200) + ', count: 200 })');
    }
    api('execute', { code: 'return { albums: API.photos.getAlbums({ owner_id: -69762228 }), photos: [' + photosCalls.join(',') + '] };' }, function(data) {
      var albums = data.response.albums.items.reverse(),
          photos = [],
          html = [],
          defs = {albums:[]},
          photosByAlbum = {},
          photosById = {},
          i;

      for (i = 0; i < data.response.photos.length; i++) {
        photos = photos.concat(data.response.photos[i].items);
      }
      photos = photos.reverse();

      loadOptions(defs);

      for (i = 0; i < albums.length; i++) {
        photosByAlbum[albums[i].id] = [];
      }
      for (i = 0; i < photos.length; i++) {
        if (photos[i].album_id <= 0) {
          continue;
        }
        photosByAlbum[photos[i].album_id].push(photos[i]);
        photosById[photos[i].id] = photos[i];
      }

      for (i = 0; i < albums.length; i++) {
        if (!albums[i].size || !albums[i].thumb_id) {
          continue;
        }

        var title = albums[i].title,
            authorMatch = albums[i].description.match(/^Автор: (.+)$/im),
            author = authorMatch ? authorMatch[1] : '',
            thumbs = [];

        for (var j = 0; j < photosByAlbum[albums[i].id].length; j++) {
          var thumb = photosByAlbum[albums[i].id][j];
          if (thumb.id == albums[i].thumb_id || thumb.height == 22) {
            continue;
          }
          thumbs.push('<div class="fl_l im_sticker_bl_simg"><img src="' + thumb.photo_75 + '" width="42" height="42"></div>');
          if (thumbs.length >= 6) {
            break;
          }
        }

        html.push(
          '<a class="fl_l im_sticker_bl" id="check_album' + albums[i].id + '_wrap">' +
            '<div class="fl_l im_sticker_bl_mimg"><img src="' + photosById[albums[i].thumb_id].photo_130 + '" width="96" height="96" class="im_sticker_bl_bimg"></div>' +
            '<div class="fl_l im_sticker_bl_imgs">' + thumbs.join('') + '</div>' +
            '<div class="im_sticker_bl_info clear">' +
              '<div class="fl_r im_sticker_bl_act"><div class="im_sticker_act fl_r" id="check_album' + albums[i].id + '">Добавить</div></div>' +
              '<div class="im_sticker_bl_name">' + title + '</div>' +
              '<div class="im_sticker_bl_desc">' + author + '</div>' +
            '</div>' +
          '</a>'
        );
      }
      ge('list_albums').innerHTML = html.join('');
      for (i = 0; i < albums.length; i++) {
        check('album' + albums[i].id, albums[i].id);
      }
    });
  } else {
    kango.browser.addEventListener(kango.browser.event.DOCUMENT_COMPLETE, onDocumentComplete);
  }
}

function onDocumentComplete(event) {
  var redirect_regex = /^https:\/\/oauth.vk.com\/blank.html#(.*)$/i,
      match = event.url.match(redirect_regex);
  if (match) {
    event.target.close();

    var params = match[1].split('&');
    var map = {};
    for (var i = 0; i < params.length; i++) {
      var kv = params[i].split('=');
      map[kv[0]] = kv[1];
    }

    if (map.access_token) {
      saveOptions({ accessToken: map.access_token, secret: map.secret });
      console.log('access_token: ', map.access_token, 'secret:', map.secret);
      checkAccessToken();
    }
  }  
}

function performAuth() {
  var redirect_uri = 'https://oauth.vk.com/blank.html';
  kango.browser.windows.getCurrent(function(wnd) {
    wnd.getCurrentTab(function(tab) {
      kango.browser.windows.create({
        url: 'https://oauth.vk.com/authorize?client_id=4301512&scope=messages,photos,offline,nohttps&redirect_uri=' + redirect_uri + '&display=popup&v=5.7&response_type=token',
        tabId: tab.id,
        focused: true,
        type: 'popup',
        left: wnd.left + (wnd.width - 700) >> 1,
        top: wnd.top + (wnd.height - 500) >> 1,
        width: 700,
        height: 500,
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
  };
  for (var i = 0; i < radio.length; i++) {
    radio[i].onclick = handler;
  }
}

ge('button_auth').addEventListener('click', performAuth, false);
ge('button_close').onclick = function() {
  window.close();
};
ge('link_logout').onclick = function() {
  saveOptions({ accessToken: false });
  checkAccessToken();
  return false;
};

function check(id, opt) {
  var wrap = ge('check_' + id + '_wrap');
  var ch = ge('check_' + id);
  if (opts.albums.indexOf(opt) !== -1) {
    ch.classList.add('im_sticker_act_blue');
  }
  ch.innerHTML = ch.classList.contains('im_sticker_act_blue') ? 'Включен' : 'Скрыт';
  wrap.addEventListener('click', function(e) {
    ch.classList.toggle('im_sticker_act_blue');
    ch.innerHTML = ch.classList.contains('im_sticker_act_blue') ? 'Включен' : 'Скрыт';
    var update = {albums: opts.albums};
    if (ch.classList.contains('im_sticker_act_blue')) {
      update.albums.push(opt);
    } else {
      update.albums.splice(update.albums.indexOf(opt), 1);
    }
    saveOptions(update);
  });
}

KangoAPI.onReady(checkAccessToken);
