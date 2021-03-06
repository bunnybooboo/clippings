/* -*- mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Clippings.
 *
 * The Initial Developer of the Original Code is 
 * Alex Eng <ateng@users.sourceforge.net>.
 * Portions created by the Initial Developer are Copyright (C) 2011-2015
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://clippings/modules/aeUtils.js");


const EXPORTED_SYMBOLS = ["aeCreateClippingFromText"];

const DEBUG = false;

const Cc = Components.classes;
const Ci = Components.interfaces;


/**
 * Creates a new clipping containing text in the provided text parameter.
 *
 * @param aClippingsSvc  Reference to an aeIClippingsService instance
 * @param aText          The text to create the new clipping from
 * @param aSourceURL     The source URL of the web page from which the clipping
 *                       text originated from
 * @param aShowDialog    Boolean flag to display or omit the New Clipping dialog
 * @param aChromeWnd     Host app window object
 * @param aParentFolder  Create clipping as a child of this folder
 * @param aDontNotify    Boolean flag to notify observers attached to the given
 *                       aeIClippingsService instance
 *
 * @return  String containing the URI of the new clipping; OR,
 *          String containing the URI of the new folder created by user, but
 *          then cancelled out of dialog; OR,
 *          An empty string if the user cancelled out of New Clipping dialog  
 *          without creating a new folder.
 */
function aeCreateClippingFromText(aClippingsSvc, aText, aSourceURL, aShowDialog, aChromeWnd, aParentFolder, aDontNotify)
{
  var rv = "";
  var clipName;
  var parentFolderURI = aParentFolder || aClippingsSvc.kRootFolderURI;
  var clipText = new String(aText);
  var srcURL = aSourceURL || "";

  if (clipText && aText) {
    clipName = aClippingsSvc.createClippingNameFromText(clipText);

    _log("aeCreateClippingFromText(): clipName: \"" + clipName + "\"; length: " + clipName.length + "; source URL: " + (srcURL || "(nil)"));

    var label = aClippingsSvc.LABEL_NONE;
    var saveSrcURL = (srcURL ? aeUtils.getPref("clippings.always_save_source_url") : false);

    if (aShowDialog) {
      var args = {
	name:  clipName,
	text:  clipText,
        label: label,
	key:   null,
        srcURL: srcURL,
        saveSrcURL: saveSrcURL,
	destFolder: null,
	userCancel: null
      };

      args.wrappedJSObject = args;
      if (aeUtils.getOS() == "Darwin") {
        let ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
        ww.openWindow(null, "chrome://clippings/content/new.xul", "newclp_dlg",
                      "centerscreen,modal,dialog=yes,resizable=no", args);
      }
      else {
        aChromeWnd.openDialog("chrome://clippings/content/new.xul",
                              "newclp_dlg", "centerscreen,modal", args);
      }

      if (args.userCancel) {
	return args.destFolder || "";
      }
      clipName = args.name;
      clipText = args.text;
      saveSrcURL = args.saveSrcURL;
      label = args.label;
      parentFolderURI = args.destFolder;
    }

    if (! aClippingsSvc.exists(parentFolderURI)) {
      throw ("createClippingFromText(): Folder does not exist: " + parentFolderURI);
    }
    _log("aeCreateClippingFromText(): Parent folder URI: " + parentFolderURI);

    if (! saveSrcURL) {
      srcURL = "";
    }

    rv = aClippingsSvc.createNewClipping(parentFolderURI, clipName, clipText, 
                                         srcURL, label, aDontNotify);

    if (args && args.key) {
      aClippingsSvc.setShortcutKey(rv, args.key);
    }
  }
  return rv; 
}


/**
 * Prints a debugging message to the error console, if debugging is enabled.
 *
 * @param aMessage  The message text
 */
function _log(aMessage)
{
  if (DEBUG) {
    var consoleSvc = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
    consoleSvc.logStringMessage("aeClippingsModule.js::" + aMessage);
  }
}
