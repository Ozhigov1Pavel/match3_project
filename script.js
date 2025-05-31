

const emojis = ['🧪', '💉', '🧮', '🧊', '🔴'];
const goalEmoji = '🔴';
const gridSize = 8;
let score = 0;
let isAnimating = false;

const game = document.getElementById('game');
const scoreEl = document.getElementById('score');
const modal = document.getElementById('winModal');

let cells = [];

function weightedRandomEmoji() {
    return Math.random() < 0.35 ? goalEmoji : emojis[Math.floor(Math.random() * (emojis.length - 1))];
}

function createBoard() {
    game.innerHTML = '';
    cells = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        game.appendChild(cell);
        cells.push(cell);
    }

    addEventListeners();
    refillBoard(true);
    setTimeout(() => checkAndRemoveMatches(true), 200);
}

function refillBoard(isInitial = false) {
    for (let i = 0; i < cells.length; i++) {
        if (!cells[i].textContent || cells[i].textContent === '') {
            cells[i].textContent = weightedRandomEmoji();
            if (!isInitial) {
                cells[i].classList.add("falling");
            }
        }
    }
    if (!isInitial) {
        setTimeout(() => {
            cells.forEach(c => c.classList.remove("falling"));
        }, 500);
    }
}

function swapCells(a, b, checkMatch = false) {
    const tmp = a.textContent;
    a.textContent = b.textContent;
    b.textContent = tmp;

    if (checkMatch) {
        isAnimating = true;
        setTimeout(() => {
            if (!checkAndRemoveMatches()) {
                const tmpBack = a.textContent;
                a.textContent = b.textContent;
                b.textContent = tmpBack;
            }
            isAnimating = false;
        }, 250);
    }
}

function checkAndRemoveMatches(initial = false) {
    let matched = false;
    const toRemove = new Set();

    for (let i = 0; i < cells.length; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const currentEmoji = cells[i].textContent;

        if (!currentEmoji) continue;

        let hMatch = [i];
        for (let j = 1; col + j < gridSize; j++) {
            if (cells[i + j].textContent === currentEmoji)
                hMatch.push(i + j);
            else break;
        }
        if (hMatch.length >= 3) hMatch.forEach(idx => toRemove.add(idx));

        let vMatch = [i];
        for (let j = 1; row + j < gridSize; j++) {
            if (cells[i + j * gridSize].textContent === currentEmoji)
                vMatch.push(i + j * gridSize);
            else break;
        }
        if (vMatch.length >= 3) vMatch.forEach(idx => toRemove.add(idx));
    }

    if (toRemove.size > 0) {
        matched = true;
        toRemove.forEach(idx => {
            if (cells[idx].textContent === goalEmoji) {
                score++;
                scoreEl.textContent = score;
            }
            cells[idx].classList.add("disappear");
        });

        setTimeout(() => {
            toRemove.forEach(idx => {
                cells[idx].textContent = '';
                cells[idx].classList.remove("disappear");
            });
            applyGravity();
        }, 300);
    }

    if (score >= 100 && !modal.classList.contains('shown')) {
        modal.classList.remove('hidden');
        modal.classList.add('shown');
    }

    return matched;
}

function applyGravity() {
    for (let col = 0; col < gridSize; col++) {
        for (let row = gridSize - 1; row > 0; row--) {
            let idx = row * gridSize + col;
            if (cells[idx].textContent === '') {
                for (let k = row - 1; k >= 0; k--) {
                    let sourceIdx = k * gridSize + col;
                    if (cells[sourceIdx].textContent !== '') {
                        cells[idx].textContent = cells[sourceIdx].textContent;
                        cells[sourceIdx].textContent = '';
                        cells[idx].classList.add("falling");
                        break;
                    }
                }
            }
        }
    }
    refillBoard();
    setTimeout(() => {
        cells.forEach(c => c.classList.remove("falling"));
        checkAndRemoveMatches();
    }, 400);
}

function addEventListeners() {
    let startX, startY, startIdx;

    cells.forEach(cell => {
        cell.addEventListener('touchstart', e => {
            const t = e.touches[0];
            startX = t.clientX;
            startY = t.clientY;
            startIdx = parseInt(cell.dataset.index);
        });

        cell.addEventListener('touchend', e => {
            const t = e.changedTouches[0];
            handleSwipe(t.clientX, t.clientY, startX, startY, startIdx);
        });

        cell.addEventListener('mousedown', e => {
            startX = e.clientX;
            startY = e.clientY;
            startIdx = parseInt(cell.dataset.index);
        });

        cell.addEventListener('mouseup', e => {
            handleSwipe(e.clientX, e.clientY, startX, startY, startIdx);
        });

        cell.addEventListener('click', () => selectCell(cell));
    });
}

function handleSwipe(endX, endY, startX, startY, startIdx) {
    const dx = endX - startX;
    const dy = endY - startY;

    let direction = null;
    if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'right' : 'left';
    } else {
        direction = dy > 0 ? 'down' : 'up';
    }

    let targetIndex = null;
    if (direction === 'up' && startIdx - gridSize >= 0) targetIndex = startIdx - gridSize;
    if (direction === 'down' && startIdx + gridSize < gridSize * gridSize) targetIndex = startIdx + gridSize;
    if (direction === 'left' && startIdx % gridSize > 0) targetIndex = startIdx - 1;
    if (direction === 'right' && startIdx % gridSize < gridSize - 1) targetIndex = startIdx + 1;

    if (targetIndex !== null) {
        const target = cells[targetIndex];
        const source = cells[startIdx];
        swapCells(source, target, true);
    }
}

createBoard();
