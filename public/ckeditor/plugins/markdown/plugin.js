/**
 * This software is licensed under MIT License
 *
 * Copyright (c) 2019 Jan Böhmer
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function() {

	var unchangedData = null;

	/**
	 * Remove html tags from given string.
	 * Taken from here: https://stackoverflow.com/questions/822452/strip-html-from-text-javascript/47140708#47140708
	 * @param html
	 * @returns {string | string}
	 */
	function stripHtml(html)
	{
		var tmp = document.createElement("DIV");
		tmp.innerHTML = html;
		return tmp.textContent || tmp.innerText || "";
	}

	function overrideDataProcessor(editor)
	{
		if(typeof(showdown) == 'undefined') return;

		var converter = new showdown.Converter();
		//Set some useful options on Showdown
		converter.setFlavor('github');
		converter.setOption('tables', true);
		converter.setOption('strikethrough', true);
		converter.setOption('parseImgDimensions', true);
		converter.setOption('smartIndentationFix', true);

		editor.dataProcessor = {
			toDataFormat: function(html, fixForBody) {
				html = html.replace(/(\r\n|\n|\r)/gm,"");
				html = html.replace('<br>', '\n');
				//Support for strikethrough
				html = html.replace('<s>', '<del>').replace('</s>', '</del>');
				return converter.makeMarkdown(html);
			},
			toHtml: function(data) {
				if(unchangedData) {
					data = unchangedData;
					unchangedData = null;
				}
				//Strip html tags from data.
				//This is useful, to convert unsupported HTML feauters to plain text and adds an basic XSS protection
				//The HTML is inside an iframe so an XSS attack can not do much harm.
				data = stripHtml(data);

				return tmp = converter.makeHtml(data);
			},
		};
	}

	CKEDITOR.plugins.add( 'markdown', {
		//requires: 'entities',

		onLoad: function() {

			CKEDITOR.addCss(
				//Show borders on tables generated by Showdown
				'table {\n' +
				'     border-width: 1px 0 0 1px;\n' +
				'     border-color: #bbb;\n' +
				'     border-style: solid;\n' +
				' }\n' +
				'\n' +
				'table td, table th {\n' +
				'    border-width: 0 1px 1px 0;\n' +
				'    border-color: #bbb;\n' +
				'    border-style: solid;\n' +
				'    padding: 10px;\n' +
				'}' +
				//Show code blocks
				'pre {\n' +
				'    display: block;\n' +
				'    padding: 9.5px;\n' +
				'    margin: 0 0 10px;\n' +
				'    font-size: 13px;\n' +
				'    line-height: 1.42857143;\n' +
				'    color: #333;\n' +
				'    word-break: break-all;\n' +
				'    word-wrap: break-word;\n' +
				'    background-color: #f5f5f5;\n' +
				'    border: 1px solid #ccc;\n' +
				'    border-radius: 4px;\n' +
				'}' +
				'padding: 0;\n' +
				'    font-size: inherit;\n' +
				'    color: inherit;\n' +
				'    white-space: pre-wrap;\n' +
				'    background-color: transparent;\n' +
				'    border-radius: 0;' +
				'code, kbd, pre, samp {\n' +
				'    font-family: Menlo, Monaco, Consolas, "Courier New", monospace;\n' +
				'}' +
				//Show images small
				'img {\n' +
				'    max-width: 35%;\n' +
				'    vertical-align: middle;' +
				'}'
			);
		},

		beforeInit: function( editor ) {
			var config = editor.config;

			CKEDITOR.tools.extend( config, {
				basicEntities: false,
				entities: false,
				fillEmptyBlocks: false
			}, true );

			editor.filter.disable();
		},

		init: function( editor ) {
			var config = editor.config;

			var rootPath = this.path;
			//We override the dataprocessor later (after we loaded t
			unchangedData = editor.getData();

			if (typeof(showdown) == 'undefined') {
				CKEDITOR.scriptLoader.load(rootPath + 'js/showdown.min.js', function() {
					overrideDataProcessor(editor);
					editor.setData(unchangedData);
				});
			}
		},

		afterInit: function( editor ) {
			//Override the data processor with our for Markdown.
			overrideDataProcessor(editor);
		}
	} );

} )();
