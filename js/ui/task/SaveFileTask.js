Ext.namespace('ui', 'ui.task');

// config - {prefix, ftype, fid, fpath, fname, lang, storeRecord}
ui.task.SaveFileTask = function(config)
{
    Ext.apply(this, config);

    var id_prefix = this.prefix + '-' + this.ftype,
        msg       = Ext.MessageBox.wait(_('Saving data...')),
        codeContent = Ext.getCmp(this.prefix + '-' + this.ftype + '-FILE-' + this.fid).getValue();

    XHR({
        scope  : this,
        params : {
            task        : 'saveFile',
            filePath    : this.fpath,
            fileName    : this.fname,
            fileLang    : this.lang,
            fileContent : codeContent
        },
        success : function(r)
        {
            var o = Ext.util.JSON.decode(r.responseText);

            if (this.prefix === 'FNU') {
                // Update our store
                if( this.ftype === 'EN' ) {
                    this.storeRecord.set('en_revision', o.revision);
                    this.storeRecord.set('fileModifiedEN', '{"user":"' + PhDOE.user.login + '", "anonymousIdent":"' + PhDOE.user.anonymousIdent + '"}');
                } else {
                    this.storeRecord.set('revision', o.en_revision);
                    this.storeRecord.set('fileModifiedLang', '{"user":"' + PhDOE.user.login + '", "anonymousIdent":"' + PhDOE.user.anonymousIdent + '"}');
                    this.storeRecord.set('maintainer', o.maintainer);
                }
                this.storeRecord.commit();
            }

            if (this.prefix === 'FE') {
                // Update our store
                if( this.ftype === 'EN' ) {
                    this.storeRecord.set('fileModifiedEN', '{"user":"' + PhDOE.user.login + '", "anonymousIdent":"' + PhDOE.user.anonymousIdent + '"}');
                    this.storeRecord.commit();
                } else {
                    this.storeRecord.set('maintainer', o.maintainer);
                    this.storeRecord.set('fileModifiedLang', '{"user":"' + PhDOE.user.login + '", "anonymousIdent":"' + PhDOE.user.anonymousIdent + '"}');
                    this.storeRecord.commit();
                }
            }
            
            if (this.prefix === 'FNR') {
                // Update our store
                if( this.ftype === 'EN' ) {
                    this.storeRecord.set('reviewed', o.reviewed);
                    this.storeRecord.set('fileModifiedEN', '{"user":"' + PhDOE.user.login + '", "anonymousIdent":"' + PhDOE.user.anonymousIdent + '"}');
                    this.storeRecord.commit();
                } else {
                    this.storeRecord.set('reviewed', o.reviewed);
                    this.storeRecord.set('maintainer', o.reviewed_maintainer);
                    this.storeRecord.set('fileModifiedLang', '{"user":"' + PhDOE.user.login + '", "anonymousIdent":"' + PhDOE.user.anonymousIdent + '"}');
                    this.storeRecord.commit();

                }
            }

            if (this.prefix === 'AF') {
                this.storeRecord.getUI().addClass('fileModifiedByMe'); // tree node
            }

            // As the content have been modified, we need to change the originalContent to handle the "codemodified" action
            Ext.getCmp(this.prefix + '-' + this.ftype + '-FILE-' + this.fid).setOriginalContent(codeContent);
            
            // Add this files into WorkTreeGrid. Before, we delete it from WorkTreeGrid if this file have been same by anothers users.
            ui.cmp.WorkTreeGrid.getInstance().delRecord(o.id);
            ui.cmp.PatchesTreeGrid.getInstance().delRecord(o.id);

            ui.cmp.WorkTreeGrid.getInstance().addRecord(
                o.id, this.lang + this.fpath, this.fname, 'update'
            );

            // reset file
            Ext.getCmp(id_prefix + '-FILE-' + this.fid + '-btn-save').disable();
            Ext.getCmp(id_prefix + '-FILE-' + this.fid).isModified = false;

            Ext.getCmp(id_prefix + '-PANEL-' + this.fid).setTitle(
                Ext.getCmp(id_prefix + '-PANEL-' + this.fid).permlink +
                Ext.getCmp(id_prefix + '-PANEL-' + this.fid).originTitle
            );

            var cmp;
            if( this.lang === 'en' ) {
                cmp = Ext.getCmp(this.prefix + '-LANG-FILE-' + this.fid);
            } else {
                cmp = Ext.getCmp(this.prefix + '-EN-FILE-' + this.fid);
            }

            if (this.ftype === 'ALL' || !cmp.isModified) {
                // reset tab-panel
                Ext.getCmp(this.prefix + '-' + this.fid).setTitle(
                    Ext.getCmp(this.prefix + '-' + this.fid).originTitle
                );
            }

            // Remove wait msg
            msg.hide();

            // Notify
            PhDOE.notify('info', _('Document saved'), String.format(_('Document <br><br><b>{0}</b><br><br> was saved successfully !'), this.lang + this.fpath + this.fname));
        },
        failure : function(r)
        {
            var o = Ext.util.JSON.decode(r.responseText);

            // Remove wait msg
            msg.hide();
            
            // If there is some Xml error, we display the Xml window
            if( o.XmlError && o.XmlError != 'no_error' )
            {
                // Display a message to inform that a file cann't be saved with some XML errors
                Ext.MessageBox.alert(_('XML Errors'), _('There is somes XML\'s errors.<br /><br />You must fix it before saving this file.<br /><br />Valid this window to show this errors.'), function() {
                    
                    new ui.cmp.CheckXmlWin({
                        errors : o.XmlError
                    });
                    
                });
            }
            
            if( o.type ) {
                PhDOE.winForbidden(o.type);
            }
            
        }
    });
};