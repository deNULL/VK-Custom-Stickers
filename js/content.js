// ==UserScript==
// @name MessagingDemo
// @include http://vk.com/*
// @include https://vk.com/*
// @require js/underscore-min.js
// ==/UserScript==

function injectScript(text) {
  var c = document.createElement('script');
  c.setAttribute('type', 'text/javascript');
  c.innerHTML = text;
  document.body.appendChild(c);
}

function injectCss(css) {
  var c = document.createElement('style');
  c.innerHTML = css;
  document.body.appendChild(c);
}

kango.xhr.send({method:'GET', url:'res/inject.js', async:true}, function(res) {
  if (res.status === 0 || res.status == 200) {
    injectScript(res.response);
 }  
});

kango.xhr.send({method:'GET', url:'res/inject.css', async:true}, function(res) {
  if (res.status === 0 || res.status == 200) {
    injectCss(res.response);
 }  
});

kango.addMessageListener('vkCustomStickers', function(event) {
  var customStickers = event.data;
  injectScript('window.VKINJECT_customStickers = ' + JSON.stringify(customStickers));
}, false);

kango.addMessageListener('injectCss', function(event) {
  injectCss(event.data);
});
