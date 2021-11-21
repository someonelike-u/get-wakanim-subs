// ==UserScript==
// @name        Get VTT To ASS subs - wakanim.tv
// @namespace   Violentmonkey Scripts
// @match       https://www.wakanim.tv/*
// @grant       GM_xmlhttpRequest
// @version     1.00
// @author      nprnvqhy
// @homepageURL https://github.com/someonelike-u/get-wakanim-subs/
// @description 11/21/2021, 06:11:00 PM
// ==/UserScript==

window.addEventListener("load", () => {
    const download = (path) => {
        createLink('Télécharger sous-titres', path);
    };

    if (tracks && tracks[0] && tracks[0].file) {
        download(tracks[0].file);
        return;
    }

    // No subs
    createLink('Sous-titres indisponibles', null);
});

function createLink(name, href, disabled) {
    const link = document.createElement('a');
    link.innerHTML = name;
    link.className = 'button -thin -outline';
    link.style.cursor = 'pointer';

    if (href) {
        link.onclick = () => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: href,
                responseType: 'text',
                onload: response => {
                    const contentSubs = response.responseText;
                    const assContent = convertVttToAss(contentSubs);
                    const a = document.createElement('a');
                    const url = window.URL.createObjectURL(new Blob([assContent]));
                    a.href = url;
                    a.download = getTitle() + '.ass';
                    a.click();
                },
                onerror: error => {
                    console.log('Error: ' + error);
                }
            });
        };
    } else {
        link.style.opacity = '0.1';
        link.style.pointerEvents = 'none';
    }

    // Append to the DOM
    const btnList = document.getElementsByClassName('button -thin -outline WatchlistBtn');
    btnList[0].before(link);
}

function getTitle() {
    const HTMLContent = document.body.innerHTML;
    const contentToGetTitle = JSON.parse(HTMLContent.split('/ld+json">')[1].split('</script>')[0]);
    const usTitle = contentToGetTitle.partOfSeries.name;
    const episodeNumber = String(contentToGetTitle.episodeNumber).padStart(2, '0');
    return usTitle + ' - ' + episodeNumber || 'subs';
}

function convertVttToAss(content) {
    let newContent = '';
    const lines = content.split(/[\r\n]+/g).filter(line => line !== '' && !line.includes('WEBVTT'));
    return addHeader() + addDialogues(lines);
}

function addHeader() {
    const font = 'Verdana';
    const textSize = '55.5';
    const textColor = '&H00FFFFFF';
    const borderColor = '&H00282828';
    const borderSize = '3.75';
    const verticalMargin = '79';

    return `[Script Info]
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${font},${textSize},${textColor},&H000000FF,${borderColor},&H00000000,-1,0,0,0,100,100,0,0,1,${borderSize},0,2,0,0,${verticalMargin},1
Style: Default - TOP,${font},${textSize},${textColor},&H000000FF,${borderColor},&H00000000,-1,0,0,0,100,100,0,0,1,${borderSize},0,8,0,0,${verticalMargin},1
Style: SIGN,${font},${textSize},${textColor},&H000000FF,${borderColor},&H00000000,-1,0,0,0,100,100,0,0,1,${borderSize},0,8,0,0,${verticalMargin},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
}

function addDialogues(lines) {
    let content = '';
    lines.forEach((line, index) => {
        if (line.includes(' --> 0')) {
            content += addLineBeginning(line, lines[index + 1]);
        } else {
            content += line;

            if (index + 1 !== lines.length) {
                if (lines[index + 1] && lines[index + 1].includes(' --> 0')) {
                    content += '\n';
                } else {
                    content += '\\N';
                }
            }
        }
    });
    
    // Delete HTML characters and set the good ass tags for italic
    const finalContent = content
        .replace(/<i>/g, '{\\i1}')
        .replace(/<\/i>/g, '{\\i0}')
        .replace(/'/g, '’')
        .replace(/&amp;/g, '&')
        .replace(/，/g, ',')
        .replace(/É/g, 'É')
        .replace(/Ô/g, 'Ô')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, '\'')
    return finalContent;
}

function addLineBeginning(line, lineContent) {
    let style = 'Default';
    if (line.includes('line')) {
        style = 'SIGN';
        const cleanLine = lineContent.replace(/<i>/g, '').replace(/<\/i>/g, '');
        const isEditDialogue = cleanLine === cleanLine.toUpperCase();
        if (!isEditDialogue) {
            style = 'Default - TOP';
        }
    }

    const times = line.split(' --> ');
    const beginTime = times[0].substring(1).substring(0, times[0].length - 2);
    const endTime = times[1].substring(1).substring(0, times[0].length - 2);

    return `Dialogue: 0,${beginTime},${endTime},${style},,0,0,0,,`;
}
