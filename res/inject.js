stManager.add(['emoji.js'], function() {
  window.VKINJECT_customStickers = null;

  function num(n,cs) {
    if (!n) return cs[2];
    n = n % 100;
    if ((n % 10 === 0) || (n % 10 > 4) || (n > 4 && n < 21)) {
      return cs[2];
    } else
    if (n % 10 == 1) {
      return cs[0];
    } else {
      return cs[1];
    }
  }

  var reinjectKey = 'injected' + Math.random().toString(26).substr(2);
  function inject(orig, hook, type, noReinject) {
    if (noReinject && orig[reinjectKey]) {
      return orig;
    }
    var f = function() {
      var ret;
      if (typeof type == 'function' || type == 'before' || type == 'replace') {
        ret = hook.apply(this, arguments);
      }
      if (type == 'manual') {
        ret = hook.call(this, arguments, orig);
      } else
      if (type != 'replace') {
        ret = orig.apply(this, arguments);
      }
      if (typeof type == 'function') {
        ret = type.apply(this, [ret].concat(arguments));
      } else
      if (!type || type == 'after') {
        ret = hook.apply(this, [ret].concat(arguments));
      }
      return ret;
    };
    if (noReinject) {
      f[reinjectKey] = true;
    }
    return f;
  }

  Emoji.getTabsCode = inject(Emoji.getTabsCode, function(args, func) {
    var extra = [],
        customStickers = window.VKINJECT_customStickers;
    if (!customStickers) {
      return func.apply(this, args);
    }

    var albums = customStickers.albums;

    for (var i = 0; i < albums.length; i++) {
      if (customStickers.opts.albums.indexOf(albums[i].id) !== -1) {
        extra.push([albums[i].id, 1]);
      }
    }
    args[0] = (args[0] || []).concat(extra);

    var html = func.apply(this, args);

    html = html.replace(/src="\/images\/store\/stickers\/(\d+)\/[^"]*"/g,
      function(orig, albumId) {
        var src = null;
        albumId = parseInt(albumId);
        for (var i = 0; i < albums.length; i++) {
          if (albums[i].id === albumId) {
            src = albums[i].img;
            break;
          }
        }
        return src ? 'src="' + src + '"' : orig;
      });
    return html;
  }, 'manual', true);

  // original tabSwitch
  var _tabSwitch = function(obj, selId, optId) {
    if (!Emoji.stickers) {
      Emoji.onStickersLoad = Emoji.tabSwitch.pbind(obj, selId, optId);
      return false;
    }
    var html;
    var opts = Emoji.opts[optId];
    var tt = opts.tt;

    var tabsCont = geByClass1('emoji_tabs', tt);
    var selEl = geByClass1('emoji_tab_sel', tabsCont);
    if (selEl == obj) {
      return;
    }
    removeClass(selEl, 'emoji_tab_sel');
    addClass(obj, 'emoji_tab_sel');
    opts.curTab = selId;

    var cont = geByClass1('emoji_scroll', tt);
    var stickerSize = (window.devicePixelRatio >= 2) ? '128' : '64';
    if (selId) {
      html = '';
      var pack = Emoji.stickers[selId];
      if (!pack) {
        return false;
      }
      var list = pack.stickers;
      var size = 64;
      var sizeDiv = 256 / size;
      for (var i in list) {
        html += '<a class="emoji_sticker_item" onclick="Emoji.stickerClick('+optId+', '+list[i][0]+');"><img width="'+parseInt(list[i][1] / sizeDiv)+'" height="'+size+'" src="/images/stickers/'+list[i][0]+'/'+stickerSize+'.png" /></a>';
      }
    } else {
      html = Emoji.ttEmojiList(optId);
    }
    
    return html;
  };

  Emoji.tabSwitch = inject(Emoji.tabSwitch, function(args, func) {
    var customStickers = window.VKINJECT_customStickers,
        selId = args[1],
        optId = args[2],
        opts = Emoji.opts[optId];
    
    var cont = geByClass1('emoji_scroll', Emoji.opts[args[2]].tt);
    if (!Emoji.stickers || !customStickers || !customStickers.photos[selId]) {
      cont.innerHTML = _tabSwitch.apply(this, args);
      opts.emojiScroll.scrollTop();
      opts.emojiScroll.update();
    }
    var stickers = customStickers.photos[selId];

    if (stickers) {
      Emoji.stickers[selId] = {stickers: []};
      for (var i = 0; i < stickers.length; i++) {
        Emoji.stickers[selId].stickers.push([stickers[i].id, 256]);
      }
    }

    var html = _tabSwitch.apply(this, args);

    if (!html) return;

    cont.innerHTML = html.replace(/src="\/images\/stickers\/(\d+)\/[^"]*"/g,
      function(_, photoId) {
        var src = '';
        photoId = parseInt(photoId);
        for (var i = 0; i < stickers.length; i++) {
          if (stickers[i].id === photoId) {
            src = stickers[i].img;
            break;
          }
        }
        return 'src="' + src + '"';
      });

    opts.emojiScroll.scrollTop();
    opts.emojiScroll.update();

  }, 'manual', true);

  Emoji.stickerClick = inject(Emoji.stickerClick, function(args, func) {
    if (args[1] >= 1000000) {
      var oldMedias = cur.imPeerMedias[cur.peer];
      var oldText = val(ge('im_txt' + cur.peer));
      cur.imPeerMedias[cur.peer] = [['photo', '-69762228_' + args[1], 1, '<div></div>', undefined]];
      IM.send();
      cur.imPeerMedias[cur.peer] = oldMedias;
      Emoji.ttHide(args[0]);
    } else {
      return func.apply(this, args);
    }
  }, 'manual', true);
});