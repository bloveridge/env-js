
__extend__(HTMLDocument.prototype,{

    open : function(){ 
        //console.log('opening doc for write.'); 
        this._open = true;  
        this._writebuffer = [];
    },
    close : function(){
        //console.log('closing doc.'); 
        if(this._open){
            HTMLParser.parseDocument(this._writebuffer.join('\n'), this);
            this._open = false;
            this._writebuffer = null;
            //console.log('finished writing doc.');
        }
    },
    write: function(htmlstring){ 
        //console.log('writing doc.'); 
        if(this._open)
            this._writebuffer = [htmlstring];
    },
    writeln: function(htmlstring){ 
        if(this.open)
            this._writebuffer.push(htmlstring); 
    }
    
});

var __elementPopped__ = function(ns, name, node){
    //console.log('popped html element %s %s %s', ns, name, node);
    var doc = node.ownerDocument,
        okay,
        event;
    switch(doc.parsing){
        case false:
            //innerHTML so dont do loading patterns for parsing
            break;
        case true:
            switch(doc+''){
                case '[object XMLDocument]':
                    break;
                case '[object HTMLDocument]':
                    switch(node.namespaceURI){
                        case "http://n.validator.nu/placeholder/":
                            break;
                        case null:
                        case "":
                        case "http://www.w3.org/1999/xhtml":
                            switch(name.toLowerCase()){
                                case 'script':
                                    try{
                                        okay = Envjs.loadLocalScript(node, null);
                                        // console.log('loaded script? %s %s', node.uuid, okay);
                                        // only fire event if we actually had something to load
                                        if (node.src && node.src.length > 0){
                                            event = doc.createEvent('HTMLEvents');
                                            event.initEvent( okay ? "load" : "error", false, false );
                                            node.dispatchEvent( event, false );
                                        }
                                    }catch(e){
                                        console.log('error loading html element %s %s %s %e', ns, name, node, e.toString());
                                    }
                                    break;
                                case 'frame':
                                case 'iframe':
                                    try{
                                        if (node.src && node.src.length > 0){
                                            //console.log("getting content document for (i)frame from %s", node.src);
                                            Envjs.loadFrame(node, Envjs.uri(node.src));
                                            event = node.ownerDocument.createEvent('HTMLEvents');
                                            event.initEvent("load", false, false);
                                            node.dispatchEvent( event, false );
                                        }else{
                                            //console.log('src/parser/htmldocument: triggering frame load (no src)');
                                        }
                                    }catch(e){
                                        console.log('error loading html element %s %s %s %e', ns, name, node, e.toString());
                                    }
                                    break;
                                case 'link':
                                    if (node.href && node.href.length > 0){
                                        // don't actually load anything, so we're "done" immediately:
                                        event = doc.createEvent('HTMLEvents');
                                        event.initEvent("load", false, false);
                                        node.dispatchEvent( event, false );
                                    }
                                    break;
                                case 'img':
                                    if (node.src && node.src.length > 0){
                                        // don't actually load anything, so we're "done" immediately:
                                        event = doc.createEvent('HTMLEvents');
                                        event.initEvent("load", false, false);
                                        node.dispatchEvent( event, false );
                                    }
                                    break;
                                case 'html':
                                    //console.log('html popped');
                                    doc.parsing = false;
                                    //DOMContentLoaded event
                                    if(doc.createEvent){
                                        event = doc.createEvent('Events');
                                        event.initEvent("DOMContentLoaded", false, false);
                                        doc.dispatchEvent( event, false );
                                    }
                                    
                                    if(doc.createEvent){
                                        event = doc.createEvent('HTMLEvents');
                                        event.initEvent("load", false, false);
                                        doc.dispatchEvent( event, false );
                                    }
                                    
                                    try{
                                        if(doc.parentWindow){
                                            event = doc.createEvent('HTMLEvents');
                                            event.initEvent("load", false, false);
                                            doc.parentWindow.dispatchEvent( event, false );
                                        }
                                        if(doc === window.document){
                                            //console.log('triggering window.load')
                                            event = doc.createEvent('HTMLEvents');
                                            event.initEvent("load", false, false);
                                            window.dispatchEvent( event, false );
                                        }
                                    }catch(e){
                                        //console.log('window load event failed %s', e);
                                        //swallow
                                    }
                                default:
                                    if(node.getAttribute('onload')){
                                        //console.log('%s onload', node);
                                        node.onload();
                                    }
                                    break;
                            }//switch on name
                        default:
                            break;
                    }//switch on ns
                    break;
                default: 
                    console.log('element popped: %s %s', ns, name, node.ownerDocument+'');
            }//switch on doc type
        default:
            break;
    }//switch on parsing
};
