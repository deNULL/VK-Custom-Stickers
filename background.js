chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.method == 'updateOptions') {
    saveOptions(request.update, true);
  } else
  if (request.method == 'getOptions') {
    sendResponse(opts);
  }
});

chrome.runtime.onInstalled.addListener(function(details) {
  chrome.tabs.create({ url: 'options.html' });
});

var albumsId = {};
var photosId = {};
chrome.webRequest.onCompleted.addListener(function(details) {
  chrome.tabs.get(details.tabId, function(tab) {
    var https = (tab.url.indexOf('https:') == 0) ? 1 : 0;
    var photoRequests = [];
    for (var i = 0; i < 20; i++) {
      photoRequests.push('API.photos.getAll({ owner_id: -69762228, offset: ' + (i * 200) + ', count: 200, no_service_albums: 1, https: ' + https + ' })');
    }
    api('execute', { code: 'return { albums: API.photos.getAlbums({ owner_id: -69762228, https: ' + https + ' }), photos: [' + photoRequests.join(',') + '] };', https: https }, function(res) {
      if (res.error) {
        return;
      }

      var stickersPhotos = {};
      var stickersAlbums = [];

      var albums = res.response.albums.items.reverse();
      for (var i = 0; i < albums.length; i++) {
        if (!albums[i].size) continue;
        albumsId[albums[i].id] = albums[i];
        stickersPhotos[albums[i].id] = { stickers: [] };
        stickersAlbums.push([albums[i].id, 1]);
      }
      var photos = [];
      for (var i = 0; i < res.response.photos.length; i++) {
        photos = photos.concat(res.response.photos[i].items);
      }
      photos = photos.reverse();
      var css = [];
      for (var i = 0; i < photos.length; i++) {
        var album_id = photos[i].album_id;
        photosId[photos[i].id] = photos[i];

        if (photos[i].height === 22) {
          css.push('.emoji_tab_' + album_id +' img {display:none !important;}');
          css.push('.emoji_tab_' + album_id +':before {content:"";display:inline-block;width:22px;height:22px;background:url(' + photos[i].photo_75 + ');background-repeat:no-repeat;}');
          css.push('.emoji_tab_' + album_id +':hover:before {background-position-x:-22px;}');
          css.push('.emoji_tab_' + album_id +'.emoji_tab_sel:before {background-position-x:-44px;}');
        } else {
          stickersPhotos[photos[i].album_id].stickers.push([photos[i].id, 256]);
        }
      }

      chrome.tabs.insertCSS(details.tabId, {
        code: css.join(' ')
      });
      chrome.tabs.executeScript(details.tabId, {
        code: "var e = document.createElement('script');e.src = chrome.extension.getURL('inject.js');e.onload=function(){window.postMessage(" + JSON.stringify({
          type: 'vkCustomStickers',
          photos: stickersPhotos,
          albums: stickersAlbums,
          opts: opts
        }) + ", '*');};document.body.appendChild(e);"
      });
    });
  });
},
{
  urls: [
    "*://*.vk.me/js/al/emoji.js*",
    "*://vk.com/js/al/emoji.js*",
  ],
  types: ["script"]
});

chrome.webRequest.onBeforeRequest.addListener(function(details) {
  var m;
  if (m = details.url.match(/stickers\/(\d+)\/thumb_(\d+)\./)) { // Album thumb
    var album_id = m[1];
    var size = m[2];

    if (albumsId[album_id] && photosId[albumsId[album_id].thumb_id]) {
      return { redirectUrl: photosId[albumsId[album_id].thumb_id].photo_75 };
    }
  } else
  if (m = details.url.match(/stickers\/(\d+)\/(\d+)\./)) { // Sticker
    var photo_id = m[1];
    var size = m[2];

    if (photosId[photo_id]) {
      return { redirectUrl: photosId[photo_id].photo_75 };
    }
  }
}, {
  urls: [
    "*://vk.com/images/store/stickers/*", //vk.com/images/store/stickers/1000000/thumb_22.png
    "*://vk.com/images/stickers/*" //vk.com/images/stickers/1000000/64.png
  ],
  types: ["image"]
}, ['blocking']);