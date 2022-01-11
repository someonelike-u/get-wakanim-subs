import shlex
import subprocess
import glob
import pysubs2

prefix = '[SubsPlease*'
assFiles = glob.glob(f'{prefix}.ass')
framerate = 24000 / 1001

# For animes season Winter 2022
shift70 = ('Tribe Nine', 'Baraou no Souretsu', 'Futsal Boys') # +264  (with funi intro)
shift46 = ('Hakozume - Kouban Joshi no Gyakushuu', 'Sasaki to Miyano', 'Slow Loop') # +240
shift_26 = ('Gensou Sangokushi - Tengen Reishinki', 'Girls\' Frontline') # +168

def getFrameToShift(name):
    if any(x in name for x in shift70):
            return 70
    if any(x in name for x in shift46):
            return 46
    if any(x in name for x in shift_26):
            return -26
    return 0

def addQuotationMark(contentFile):
    getOnlyLines = contentFile.split('Effect, Text\n')[1]
    lines = list(filter(None, getOnlyLines.split('\n')))

    # Clean lines
    for index, line in enumerate(lines):
        lines[index] = line.split('0,0,,')[1]

    # Add quotation mark
    previousQuote = ' »'
    finalContent = contentFile
    for index, line in enumerate(lines):
        if '"' not in line:
            continue
        nbQuotes = line.count('"')
        if nbQuotes > 0:
            for _ in range(nbQuotes):
                if previousQuote == ' »':
                    finalContent = finalContent.replace(line, line.replace('"', '« ', 1))
                    line = line.replace('"', '« ', 1)
                    previousQuote = '« '
                else:
                    finalContent = finalContent.replace(line, line.replace('"', ' »', 1))
                    line = line.replace('"', ' »', 1)
                    previousQuote = ' »'
    return finalContent.replace(' - ', ' – ')

if __name__ == '__main__':
    for file in assFiles:
        print(f'File: {file}')

        print('Shifting...')
        subs = pysubs2.load(file, fps=framerate)
        subs.shift(frames=getFrameToShift(file), fps=framerate)
        subs.save(file, fps=framerate)
        
        print('Set dialogues style...')
        formatFileName = file.replace("'", "\\'")
        print(formatFileName)
        setDialoguesCommand = f'"C:\\Program Files\\Aegisub\\aegisub-cli.exe" --automation baguettisationH.lua "{formatFileName}" "{formatFileName}" Baguettisation'
        subprocess.run(shlex.split(setDialoguesCommand))

        print('Add French quotation mark')
        openFile = open(file, 'r', encoding='utf8', errors='ignore')
        contentFile = openFile.read()
        openFile.close()

        overwriteFile = open(file, 'w', encoding='utf8', errors='ignore')
        overwriteFile.write(addQuotationMark(contentFile))
        overwriteFile.close()
        
        print(f'[DONE] Ass file: {file}\n')
