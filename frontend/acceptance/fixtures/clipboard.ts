/**
 * Clipboard payloads for the paste pipelines of volto-plate's wiki editor preset.
 */

/**
 * HTML as Microsoft Word puts it on the clipboard: `Mso*` classes, `mso-*`
 * styles, list items encoded as paragraphs with `mso-list` and conditional
 * comments for the list markers. This is what triggers `DocxPlugin`'s cleanup.
 */
export const DOCX_HTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head><meta name=ProgId content=Word.Document><meta name=Generator content="Microsoft Word 15"></head>
<body lang=EN-US style='tab-interval:.5in;word-wrap:break-word'>
<!--StartFragment-->
<h2>Word heading</h2>

<p class=MsoNormal>Word paragraph with <b>bold</b>, <i>italic</i> and a
<a href="https://plone.org">Word link</a>.<o:p></o:p></p>

<p class=MsoListParagraphCxSpFirst style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol'><span
style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>Word bullet one<o:p></o:p></p>

<p class=MsoListParagraphCxSpMiddle style='margin-left:1.0in;mso-add-space:auto;text-indent:-.25in;mso-list:l0 level2 lfo1'><![if !supportLists]><span
style='font-family:"Courier New";mso-fareast-font-family:"Courier New"'><span
style='mso-list:Ignore'>o<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;
</span></span></span><![endif]>Word bullet nested<o:p></o:p></p>

<p class=MsoListParagraphCxSpLast style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol'><span
style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>Word bullet two<o:p></o:p></p>

<p class=MsoListParagraphCxSpFirst style='text-indent:-.25in;mso-list:l1 level1 lfo2'><![if !supportLists]><span
style='mso-bidi-font-family:Calibri'><span style='mso-list:Ignore'>1.<span
style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>Word number one<o:p></o:p></p>

<p class=MsoListParagraphCxSpLast style='text-indent:-.25in;mso-list:l1 level1 lfo2'><![if !supportLists]><span
style='mso-bidi-font-family:Calibri'><span style='mso-list:Ignore'>2.<span
style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>Word number two<o:p></o:p></p>

<table class=MsoTableGrid border=1 cellspacing=0 cellpadding=0
 style='border-collapse:collapse;border:none;mso-border-alt:solid windowtext .5pt'>
 <tr>
  <td width=312 valign=top style='width:233.75pt;border:solid windowtext 1.0pt'>
  <p class=MsoNormal>Word cell A1<o:p></o:p></p></td>
  <td width=312 valign=top style='width:233.75pt;border:solid windowtext 1.0pt'>
  <p class=MsoNormal>Word cell B1<o:p></o:p></p></td>
 </tr>
 <tr>
  <td width=312 valign=top style='width:233.75pt;border:solid windowtext 1.0pt'>
  <p class=MsoNormal>Word cell A2<o:p></o:p></p></td>
  <td width=312 valign=top style='width:233.75pt;border:solid windowtext 1.0pt'>
  <p class=MsoNormal>Word cell B2<o:p></o:p></p></td>
 </tr>
</table>
<!--EndFragment-->
</body>
</html>`;

/** HTML as copied from a regular web page. */
export const WEB_HTML = `<meta charset="utf-8">
<h2>Web heading</h2>
<p>Web paragraph with <strong>bold</strong>, <em>italic</em> and a <a href="https://plone.org">web link</a>.</p>
<ul><li>Web bullet one</li><li>Web bullet two</li></ul>
<ol><li>Web number one</li><li>Web number two</li></ol>
<blockquote><p>Web quote</p></blockquote>
<pre><code>const web = true;</code></pre>
<table><tbody>
<tr><td>Web cell A1</td><td>Web cell B1</td></tr>
<tr><td>Web cell A2</td><td>Web cell B2</td></tr>
</tbody></table>`;

/** Markdown pasted as plain text. */
export const MARKDOWN_TEXT = `## Markdown heading

Markdown paragraph with **bold**, *italic* and a [markdown link](https://plone.org).

- Markdown bullet one
- Markdown bullet two

1. Markdown number one
2. Markdown number two

> Markdown quote

\`\`\`js
const markdown = true;
\`\`\`

| Markdown A | Markdown B |
| --- | --- |
| Markdown cell A2 | Markdown cell B2 |
`;

/** A 1x1 PNG, the image of the image paste payloads. */
export const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnSUs8AAAAASUVORK5CYII=';

/**
 * HTML of a Word selection with an image between two paragraphs. Word points
 * the image at a temporary `file://` copy and links it to its VML shape,
 * whose image data comes with the RTF of the selection (`DOCX_IMAGE_RTF`).
 */
export const DOCX_IMAGE_HTML = `<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head><meta name=ProgId content=Word.Document><meta name=Generator content="Microsoft Word 15"></head>
<body lang=EN-US style='tab-interval:.5in;word-wrap:break-word'>
<!--StartFragment-->
<p class=MsoNormal>Word text before the image<o:p></o:p></p>

<p class=MsoNormal><!--[if gte vml 1]><v:shape id="Picture_x0020_1"
 o:spid="_x0000_i1025" type="#_x0000_t75" alt="Word image"
 style='width:10pt;height:10pt;visibility:visible;mso-wrap-style:square'>
 <v:imagedata src="file:///C:/Users/test/AppData/Local/Temp/msohtmlclip1/01/clip_image001.png"
  o:title=""/>
</v:shape><![endif]--><![if !vml]><img width=1 height=1
src="file:///C:/Users/test/AppData/Local/Temp/msohtmlclip1/01/clip_image001.png"
alt="Word image" v:shapes="Picture_x0020_1"><![endif]><o:p></o:p></p>

<p class=MsoNormal>Word text after the image<o:p></o:p></p>
<!--EndFragment-->
</body>
</html>`;

/** The RTF Word puts next to `DOCX_IMAGE_HTML`, with the image data. */
export const DOCX_IMAGE_RTF = `{\\rtf1\\ansi\\ansicpg1252\\deff0
{\\pard\\plain Word text before the image\\par}
{\\pard\\plain {\\*\\shppict{\\pict{\\*\\picprop\\shplid1025{\\sp{\\sn shapeType}{\\sv 75}}{\\sp{\\sn fFlipH}{\\sv 0}}}\\picscalex100\\picscaley100\\picw26\\pich26\\picwgoal20\\pichgoal20\\pngblip\\bliptag-1288012592{\\*\\blipuid b33a6dd0a1b2c3d4e5f60718293a4b5c}${Buffer.from(PNG_BASE64, 'base64').toString('hex')}}}}\\par}
{\\pard\\plain Word text after the image\\par}
}`;

/** Images of a site that allows fetching them (CORS) and of one that does not. */
export const REMOTE_IMAGE_URL = 'https://images.example.test/remote-photo.png';
export const BLOCKED_IMAGE_URL = 'https://blocked.example.test/photo.png';

/**
 * HTML of a web page with an image inside a paragraph (embedded as a data
 * URL, as Google Docs does), and images of other sites.
 */
export const WEB_IMAGE_HTML = `<meta charset="utf-8">
<p>Web text before <img src="data:image/png;base64,${PNG_BASE64}" alt="Embedded image"> web text after</p>
<p><a href="https://plone.org"><img src="${REMOTE_IMAGE_URL}" alt="Remote image"></a></p>
<p><img src="${BLOCKED_IMAGE_URL}" alt="Blocked image"></p>`;

/**
 * HTML of a LibreOffice selection with an image between two paragraphs.
 * LibreOffice points the image at a temporary file and puts its data in the
 * RTF only (`LIBREOFFICE_IMAGE_RTF`), without Word's VML shapes.
 */
export const LIBREOFFICE_IMAGE_HTML = `<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
	<meta name="generator" content="LibreOffice 25.8.4.2 (MacOSX)"/>
</head>
<body lang="en-US" dir="ltr">
<p class="western" style="margin-bottom: 0.1in"><font face="Arial, serif">LibreOffice text before the image</font></p>
<p class="western" align="center" style="margin-bottom: 0.1in"><img src="file:///Users/test/Library/Application%20Support/LibreOffice/4/user/temp/lu1234.tmp/lu1234_tmp_2c9e135.png" name="Picture 1" alt="LibreOffice image" align="bottom" hspace="12" width="1" height="1" border="0"/>
</p>
<p class="western" style="margin-bottom: 0.1in"><font face="Arial, serif">LibreOffice text after the image</font></p>
</body>
</html>`;

/** The RTF LibreOffice puts next to `LIBREOFFICE_IMAGE_HTML`. */
export const LIBREOFFICE_IMAGE_RTF = `{\\rtf1\\ansi\\deff4\\adeflang1025
{\\pard\\plain \\s0\\ql LibreOffice text before the image\\par}
\\pard\\plain \\s0\\qc{
{\\pict{\\*\\picprop{\\sp{\\sn wzDescription}{\\sv A one pixel image}}{\\sp{\\sn wzName}{\\sv LibreOffice image}}}\\picscalex100\\picscaley100\\piccropl0\\piccropr0\\piccropt0\\piccropb0\\picw1\\pich1\\picwgoal15\\pichgoal15\\pngblip
${Buffer.from(PNG_BASE64, 'base64')
  .toString('hex')
  .replace(/(.{64})/g, '$1\n')}}}
\\par \\pard\\plain \\s0\\ql LibreOffice text after the image\\par}`;
