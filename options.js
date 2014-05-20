function checkAccessToken() {
  ge('block_auth').style.display = opts.accessToken ? 'none' : 'block';
  ge('block_logged').style.display = opts.accessToken ? 'block' : 'none';
  ge('block_settings').style.display = opts.accessToken ? 'block' : 'none';

  if (opts.accessToken) {

    api('users.get', {}, function(data) {
      if (data.error) {
        saveOptions({ accessToken: false });
        checkAccessToken();
        return true;
      }

      saveOptions({ userID: data.response[0].id, firstName: data.response[0].first_name, lastName: data.response[0].last_name });

      ge('link_user').href = 'http://vk.com/id' + opts.userID;
      ge('link_user').innerHTML = opts.firstName + ' ' + opts.lastName;
    });
    var photoRequests = [];
    for (var i = 0; i < 20; i++) {
      photoRequests.push('API.photos.getAll({ owner_id: -69762228, offset: ' + (i * 200) + ', count: 200, no_service_albums: 1 })');
    }
    api('execute', { code: 'return { albums: API.photos.getAlbums({ owner_id: -69762228 }), photos: [' + photoRequests.join(',') + '] };' }, function(data) {
      if (data.error) {
        saveOptions({ accessToken: false });
        checkAccessToken();
        return true;
      }

      var albums = data.response.albums.items.reverse();
      var photos = [];
      for (var i = 0; i < data.response.photos.length; i++) {
        photos = photos.concat(data.response.photos[i].items);
      }
      photos = photos.reverse();
      var html = [];
      var defs = {};
      var photosByAlbum = {};
      var photosById = {};

      for (var i = 0; i < albums.length; i++) {
        defs['album' +  + albums[i].id] = false;
        photosByAlbum[albums[i].id] = [];
      }
      for (var i = 0; i < photos.length; i++) {
        console.log(photos[i].album_id, photos[i], photosByAlbum[photos[i].album_id]);
        photosByAlbum[photos[i].album_id].push(photos[i]);
        photosById[photos[i].id] = photos[i];
      }

      loadOptions(defs);

      for (var i = 0; i < albums.length; i++) {
        if (!albums[i].size || !albums[i].thumb_id) {
          continue;
        }

        var m;
        var title = albums[i].title;
        var author = '';
        if (m = albums[i].description.match(/^Автор: (.+)$/im)) {
          author = m[1];
        }

        var thumbs = [];
        for (var j = 0; j < photosByAlbum[albums[i].id].length; j++) {
          var thumb = photosByAlbum[albums[i].id][j];
          if (thumb.id == albums[i].thumb_id) {
            continue;
          }
          thumbs.push('<div class="fl_l im_sticker_bl_simg"><img src="' + thumb.photo_75 + '" width="42" height="42"></div>');
          if (thumbs.length >= 6) {
            break;
          }
        }

        html.push(
'<a class="fl_l im_sticker_bl" id="check_album' + albums[i].id + '_wrap">\
  <div class="fl_l im_sticker_bl_mimg"><img src="' + photosById[albums[i].thumb_id].photo_130 + '" width="96" height="96" class="im_sticker_bl_bimg"></div>\
  <div class="fl_l im_sticker_bl_imgs">' + thumbs.join('') + '</div>\
  <div class="im_sticker_bl_info clear">\
    <div class="fl_r im_sticker_bl_act"><div class="im_sticker_act fl_r" id="check_album' + albums[i].id + '">Добавить</div></div>\
    <div class="im_sticker_bl_name">' + title + '</div>\
    <div class="im_sticker_bl_desc">' + author + '</div>\
  </div>\
</a>');
        //html.push('<div style="margin: 12px" id="check_album' + albums[i].id + '" class="checkbox' + (opts['album' + albums[i].id] ? ' on' : '') + '"><div></div><span>' + albums[i].title + '</span></div>');
      }
      ge('list_albums').innerHTML = html.join('');
      for (var i = 0; i < albums.length; i++) {
        check('album' + albums[i].id, 'album' + albums[i].id);
      }
    });
  }
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
  var wrap = ge('check_' + id + '_wrap');
  var ch = ge('check_' + id);
  if (opts[opt]) {
    ch.classList.add('im_sticker_act_blue');
  }
  ch.innerHTML = ch.classList.contains('im_sticker_act_blue') ? 'Включен' : 'Скрыт';
  wrap.onclick = function(e) {
    ch.classList.toggle('im_sticker_act_blue');
    ch.innerHTML = ch.classList.contains('im_sticker_act_blue') ? 'Включен' : 'Скрыт';
    var update = {};
    update[opt] = ch.classList.contains('im_sticker_act_blue');
    saveOptions(update);
  }
}

checkAccessToken();