/******************************************************************************* 
 * 
 * Copyright 2011 Zack Grossbart 
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 ******************************************************************************/
 
/**
 * The code manager handles editing the animation source code in 
 * the page.  It isn't required to make the animation run.
 */
codeMgr = {
    
    /**
     * Run the script contents of the editor
     */
    runScript: function() {
        /* code for an ancient version of paper
        try {
            // Update script to edited version
            var code = codeMgr.editor.getValue();
            var canvas = codeMgr.scope.view.canvas;
            codeMgr.scope.clear();
            codeMgr.scope.setup(canvas);
            //codeMgr.scope.evaluate(code);
            codeMgr.scope.execute(code);
            
            codeMgr.hideError();
            $('#editContainer').hide();
            $('#container').show();
        } catch (e) {
            codeMgr.showError(e);
        }
        // */
        try {
            var code = codeMgr.editor.getValue();
            var canvas = codeMgr.scope.view.element;
            var scope;
            var url = "dandelion.pjs";

            // remove the existing scope and create a new one
            codeMgr.scope.remove();
            codeMgr.scope = scope = new paper.PaperScope();
            //scope.setup($("#canvas")[0]);
            scope.setup(canvas);

            // execute the code
            scope.execute(code, url, {source: code});
            
            codeMgr.hideError();
            $('#editContainer').hide();
            $('#container').show();
            
        } catch (e) {
            codeMgr.showError(e);
        }
    },
    
    /**
     * Hide the error message if it is visible
     */
    hideError: function(/*string*/ err) {
        if ($('#err').is(":visible")) {
            $('#err').hide();
            $('#editContainer').css('height', ($(window).height() - 75) + 'px');
            $('div.fullscreen').css('top', '0px');
             
            codeMgr.editor.focus();
            codeMgr.editor.refresh();
        }
    },
    
    /**
     * Show the specified error message above the script editor
     */
    showError: function(/*string*/ err) {
        console.log('err: ' + err);
        $('#err').show().text('Error running script: ' + err);
        $('#editContainer').css('height', ($(window).height() - 175) + 'px');
        $('div.fullscreen').css('top', '100px');
         
        codeMgr.editor.focus();
        codeMgr.editor.refresh();
    },
    
    /**
     * Show the script editor
     */
    editScript: function() {
        $('#container').hide();
        $('#editContainer').show();
         
        var editorDiv = $('.CodeMirror-scroll');
        editorDiv.addClass('fullscreen');
        editorDiv.height('100%');
        editorDiv.width('100%');

        codeMgr.editor.focus();
        codeMgr.editor.refresh();
    }
};

jQuery(document).ready(function() {
    
    var file = (function func1() {
        var result;
        
        $.ajax({
            type: "GET",
            url: 'dandelion.pjs',
            async: false,
            processData: false,
            dataType: 'html',
            success: function(data){
                result = data;
            }
        });
        
        return result;
    })();
    
    $('#code').val(file);
    
    codeMgr.editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        matchBrackets: true,
        mode: 'javascript',
        lineNumbers: true,
        matchBrackets: true,
        indentUnit: 4,
        tabMode: 'shift'
    });
    
    $('#editContainer').css('height', ($(window).height() - 75) + 'px');
    
    $('#run, #reload').click(function(evt) {
        codeMgr.runScript();
    });
    
    $('#edit').click(function(evt) {
        codeMgr.editScript();
    });
});
