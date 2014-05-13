var PUBLIC_ID = 69762228;

kango.browser.addEventListener(kango.browser.event.DOCUMENT_COMPLETE, function(event) {
  var albums = opts.albums,
      photoRequests = [],
      albumRequest;

  if (!/https?:\/\/vk.com/.test(event.url)) {
    return;
  }

  for (var i = 0; i < albums.length; i++) {
    photoRequests.push(apiRequestString('photos.get', { owner_id: -PUBLIC_ID, album_id: albums[i]}));
  }

  albumRequest = apiRequestString('photos.getAlbums', {owner_id: -PUBLIC_ID, album_ids: albums});

  api('execute', { code: 'return { albums: ' + albumRequest + ', photos: [' + photoRequests.join(',') + '] };' }, function(res) {
    var stickersPhotos = {},
        stickersAlbums = [],
        albums = res.response.albums.items,
        photos = _.flatten(_.pluck(res.response.photos, 'items')).reverse(),
        css = [],
        photosById = _.indexBy(photos, 'id'),
        i;

    _.each(albums, function (album) {
      if (!album.size) return;
      stickersPhotos[album.id] = [];
      if (photosById[album.thumb_id]) {
        stickersAlbums.push({
          id: album.id,
          img: photosById[album.thumb_id].photo_75
        });
      }
    });

    _.each(photos, function (photo) {
      var album_id = photo.album_id;

      if (photo.height === 22) {
        css.push('.emoji_tab_' + album_id +' img {display:none !important;}');
        css.push('.emoji_tab_' + album_id +':before {content:"";display:block;width:22px;height:22px;background:url(' + photo.photo_75 + ');background-repeat:no-repeat;}');
        css.push('.emoji_tab_' + album_id +':hover:before {background-position-x:-22px;}');
        css.push('.emoji_tab_' + album_id +'.emoji_tab_sel:before {background-position-x:-44px;}');
      } else {
        stickersPhotos[album_id].push({
          id: photo.id, 
          img: photo.photo_75
        });
      }
    });

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

kango.addMessageListener('updateOptions', function(event) {
  saveOptions(event.data.update, true);
});

kango.addMessageListener('getOptions', function(event) {
    event.source.dispatchMessage('setOptions', opts);
});