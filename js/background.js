kango.addMessageListener('updateOptions', function(event) {
  saveOptions(event.data.update, true);
});

kango.addMessageListener('getOptions', function(event) {
    event.source.dispatchMessage('setOptions', opts);
});

var albumsId = {},
    photosId = {};

kango.browser.addEventListener(kango.browser.event.DOCUMENT_COMPLETE, function(event) {
  var albums = opts.albums,
      photoRequests = [];

  if (!/https?:\/\/vk.com/.test(event.url)) {
    return;
  }

  for (var i = 0; i < albums.length; i++) {
    photoRequests.push('API.photos.get({ owner_id: -69762228, album_id: ' + albums[i] + '})');
  }

  api('execute', { code: 'return { albums: API.photos.getAlbums({ owner_id: -69762228 }), photos: [' + photoRequests.join(',') + '] };' }, function(res) {
    var stickersPhotos = {},
        stickersAlbums = [],
        albums = res.response.albums.items,
        photos = [],
        css = [],
        i;

    for (i = 0; i < res.response.photos.length; i++) {
      photos = photos.concat(res.response.photos[i].items);
    }
    photos = photos.reverse();

    for (i = 0; i < photos.length; i++) {
      photosId[photos[i].id] = photos[i];
    }

    for (i = 0; i < albums.length; i++) {
      if (!albums[i].size) continue;
      albumsId[albums[i].id] = albums[i];
      stickersPhotos[albums[i].id] = { stickers: [] };
      if (photosId[albums[i].thumb_id]) {
        stickersAlbums.push([albums[i].id, 1, photosId[albums[i].thumb_id].photo_75]);
      }
    }

    for (i = 0; i < photos.length; i++) {
      photosId[photos[i].id] = photos[i];

      if (photos[i].height == 22) {
        css.push('.emoji_tab_' + photos[i].album_id +' img {display:none !important;}');
        css.push('.emoji_tab_' + photos[i].album_id +':before {content:"";display:block;width:22px;height:22px;background:url(' + photos[i].photo_75 + ');background-repeat:no-repeat;}');
        css.push('.emoji_tab_' + photos[i].album_id +':hover:before {background-position-x:-22px;}');
        css.push('.emoji_tab_' + photos[i].album_id +'.emoji_tab_sel:before {background-position-x:-44px;}');
      } else {
        stickersPhotos[photos[i].album_id].stickers.push([photos[i].id, 256, photos[i].photo_75]);
      }
    }

    event.target.dispatchMessage('vkCustomStickers', {
      photos: stickersPhotos,
      albums: stickersAlbums,
      opts: opts
    });

    if (css) {
      event.target.dispatchMessage('injectCss', css.join(' '));      
    }
  });
});