/*
Copyright (c) 2010 Nexopia.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

function ResponseHandler(options) {
  Object.extend(this, options);
  var that = this;
  var onSuccess = this.onSuccess;
  this.onSuccess = function(o) {
    that.handleResponse(o, this);
    onSuccess.call(this, o); //should execute in the scope passed to it by the event object
  };
  var onFailure = this.onFailure;
  this.onFailure = function(o) {
    that.handleResponse(o, this);
    onFailure.call(this, o); //should execute in the scope passed to it by the event object
  };
}

ResponseHandler.prototype = {
  onSuccess: function(o) {
  },
  onFailure: function(o) {
  },
  handleResponse: function(o, scope) {
    var xml = document.createElement("temp");
    //The prepended div is necessary to make IE6 parse script nodes that occur before content nodes.
    xml.innerHTML = "<div>THIS IS AN IE6 HACK</div>"+o.responseText;
    xml.removeChild(xml.firstChild);
    var setupNodes = [];
    //execute any script nodes we sent
    var scriptNodes = xml.getElementsByTagName('script');
    for (var i=0; i<scriptNodes.length;i++) {
      var script = scriptNodes[i].innerHTML;
      if (script.indexOf('<!--') == 0) {
        script = script.substring(4, script.lastIndexOf('//-->'));
      }
      eval(script);
    }

    var children = [];
    //we're going to remove nodes so we need to copy the array first
    for (i=0;i<xml.childNodes.length;i++) {
      children.push(xml.childNodes[i]);
    }
    for (i=0; i<children.length; i++) {
      var node = children[i];
      if (node.nodeType != 1 || node.tagName.toUpperCase() == "SCRIPT") { //Node.ELEMENT_NODE (ie6 doesn't have this constant)
        continue;
      }
      var original = null;
      if (node.attributes && node.attributes.id) {
        original = document.getElementById(node.attributes.id.value);
      }
      if (original) {
        if (this.copyStyle) {
          for (var key in original.style) {
            try {
              node.style[key] = original.style[key];
            } catch (err) {
              //some properties can't be copied, if they can't that's fine just continue with the ones that can
            }
          }
        }
        original.parentNode.replaceChild(node, original);
        Overlord.summonMinions(node);
      } else if (this.newNode) {
        var inserted = this.newNode.call(scope, node);
        if (inserted) {
          Overlord.summonMinions(node);
        }
      }
      if (!original && !inserted && $(node).hasClassName('info_message')) {
        var infoMessages = $('info_messages');
        if (infoMessages) {
          infoMessages.appendChild(node);
          infoMessages.setStyle({display: 'block'});
        }
      }
      if (node.attributes && node.attributes.id && ResponseHandler.registeredHandlers[node.attributes.id.value]) {
        ResponseHandler.registeredHandlers[node.attributes.id.value].execute();
      }
    }
  },
  copyStyle: false //copy the style tag from the on screen element when substituting?
};
