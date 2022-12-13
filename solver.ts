const GROUP_WIDTH = 3
const GROUP_HEIGHT = 3
const AREA_HEIGHT = 9
const AREA_WIDTH = 9

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

class Button {
    public node: HTMLInputElement | null;

    get disabled() {
        return this.node.disabled
    }

    set disabled(to) {
        this.node.disabled = to
    }

    constructor(id: string) {
        this.node = document.getElementById(id) as HTMLInputElement
    }

    bind(callback) {
        this.node.addEventListener('click', callback)
    }
}

enum Key {
    Backspace = 'Backspace',
    Enter = 'Enter',
    NumpadEnter = 'NumpadEnter',
    Space = 'Space',
    ArrowLeft = 'ArrowLeft',
    ArrowUp = 'ArrowUp',
    ArrowRight = 'ArrowRight',
    ArrowDown = 'ArrowDown',
    Delete = 'Delete',
}

class Position {
    constructor(public x: number, public y: number) {
    };
}

function beep() {
    let player: HTMLAudioElement = document.createElement('audio')
    player.src = 'beep.wav'
    player.autoplay = true
    player.onended = () => document.body.removeChild(player)
    document.body.appendChild(player)
}

function fillAreaData(data: string) {
    let cells: NodeListOf<HTMLTableCellElement> = app.querySelectorAll('tbody td')

    for (let i = 0; i < cells.length; i++) {
        if (data[i] == ' ') {
            delete cells[i].dataset.value
        } else {
            cells[i].dataset.value = data[i]
        }
    }
}

function focusToCell(position: Position = new Position(0, 0)): void {
    app.querySelectorAll('tbody td').forEach((cell: HTMLTableCellElement, idx: number) => {
        let px = idx % (3 * GROUP_WIDTH)
        let py = Math.floor(idx / (3 * GROUP_HEIGHT))

        if (px == position.x && py == position.y)
            cell.classList.add('focused')
        else
            cell.classList.remove('focused')
    })
}

function fillCurrentCell(value: string = null) {
    let cell: HTMLTableCellElement = app.querySelector('td.focused')

    if (cell) {
        if (value)
            cell.dataset.value = value
        else
            delete cell.dataset.value
    }
}

function getFocusedCellPosition(): Position | null {
    let cells = app.querySelectorAll('tbody td')

    for (let i = 0; i < cells.length; i++) {
        if (cells[i].classList.contains('focused')) {
            return new Position(i % (GROUP_WIDTH * 3), Math.floor(i / (GROUP_HEIGHT * 3)))
        }
    }
}

function resetArea() {
    app.querySelectorAll('tbody td').forEach((c: HTMLTableCellElement) => {
        delete c.dataset.value
    })
}

function getCellValueAt(position: Position): string | void {
    return getCellValueByPosition(position.x, position.y)
}

function getCellValueByPosition(x: number, y: number): string {
    let value = null

    app.querySelectorAll('tbody td').forEach((cell: HTMLTableCellElement, idx: number) => {
        let px = idx % (3 * GROUP_WIDTH)
        let py = Math.floor(idx / (3 * GROUP_HEIGHT))

        if (px == x && py == y)
            value = cell.dataset.value
    })

    return value
}

function setCellValue(position: Position, value: string | number = null, auto: boolean = false): string | void {
    let cells: NodeListOf<HTMLTableCellElement> = app.querySelectorAll('tbody td')

    for (let idx: number = 0; idx < cells.length; idx++) {
        let cell = cells[idx]

        let px = idx % (3 * GROUP_WIDTH)
        let py = Math.floor(idx / (3 * GROUP_HEIGHT))

        if (px == position.x && py == position.y) {
            if (value) {
                cell.dataset.value = value.toString()

                if (auto)
                    cell.classList.add('auto')
            } else {
                delete cell.dataset.value
            }

            break
        }
    }
}

async function sleep(ms: number) {
    await new Promise<void>(r => setTimeout(r, ms))
}

function checkConflictsByRowAndCellAndGroup(position: Position, digit: string): boolean {
    // region Check uniqueness in row
    for (let x: number = 0; x < AREA_WIDTH; x++) {
        if (x == position.x)
            continue

        if (getCellValueByPosition(x, position.y) == digit) {
            return false
        }
    }
    // endregion

    // region Check uniqueness in col
    for (let y: number = 0; y < AREA_HEIGHT; y++) {
        if (y == position.y)
            continue

        if (getCellValueByPosition(position.x, y) == digit) {
            return false
        }
    }
    // endregion

    let xInGroup = position.x % GROUP_WIDTH
    let yInGroup = position.y % GROUP_HEIGHT

    let xGroupBoundFrom = Math.floor(position.x / GROUP_WIDTH) * GROUP_WIDTH
    let xGroupBoundTo = xGroupBoundFrom + GROUP_WIDTH

    let yGroupBoundFrom = Math.floor(position.y / GROUP_HEIGHT) * GROUP_HEIGHT
    let yGroupBoundTo = yGroupBoundFrom + GROUP_HEIGHT

    // region Check by group uniqueness
    for (let x: number = xGroupBoundFrom; x < xGroupBoundTo; x++) {
        for (let y: number = yGroupBoundFrom; y < yGroupBoundTo; y++) {
            if (x == xInGroup && y == yInGroup)
                continue

            if (getCellValueByPosition(x, y) == digit) {
                return false
            }
        }
    }
    // endregion

    return true
}

function hasEmptyCells(): boolean {
    return app.querySelectorAll('tbody td[data-value]').length < AREA_WIDTH * AREA_HEIGHT
}

async function solveArea() {
    solveBtn.disabled = true
    resetBtn.disabled = true
    fillDemoBtn.disabled = true


    while (hasEmptyCells()) {
        let somethingChanged = true

        // region Determine values by conflicts
        while (somethingChanged) {
            somethingChanged = false

            for (let row: number = 0; row < AREA_WIDTH; row++) {
                for (let column: number = 0; column < AREA_HEIGHT; column++) {
                    let position = new Position(column, row)
                    let value: string = getCellValueAt(position) || ''

                    if (value)
                        continue

                    focusToCell(position)

                    let variantsInCell: Array<number> = []

                    for (let digit = 1; digit <= (GROUP_WIDTH * GROUP_HEIGHT); digit++) {
                        await sleep(1)

                        if (checkConflictsByRowAndCellAndGroup(position, digit.toString())) {
                            variantsInCell.push(digit)
                        }
                    }

                    if (variantsInCell.length == 1) {
                        setCellValue(position, variantsInCell[0])
                        somethingChanged = true
                    } else {
                        setCellValue(position)
                    }


                }
            }
        }
        // endregion

        if (!hasEmptyCells()) {
            break;
        }

        // region Determine by group possibilities
        for (let digit: number = 1; digit <= (GROUP_WIDTH * GROUP_HEIGHT); digit++) {
            if (app.querySelectorAll(`tbody td[data-value="${digit}"]`).length == 0) {
                continue
            }

            for (let groupY: number = 0; groupY < AREA_HEIGHT / GROUP_HEIGHT; groupY++) {
                for (let groupX: number = 0; groupX < AREA_WIDTH / GROUP_WIDTH; groupX++) {
                    console.log(`${digit} - ${groupY} - ${groupX}`)

                    let xGroupBoundFrom = groupX * GROUP_WIDTH
                    let xGroupBoundTo = xGroupBoundFrom + GROUP_WIDTH

                    let yGroupBoundFrom = groupY * GROUP_HEIGHT
                    let yGroupBoundTo = yGroupBoundFrom + GROUP_HEIGHT

                    let possiblePositionsInGroup: Array<Position> = []

                    for (let y: number = yGroupBoundFrom; y < yGroupBoundTo; y++) {
                        for (let x: number = xGroupBoundFrom; x < xGroupBoundTo; x++) {
                            if (getCellValueByPosition(x, y) == digit.toString()) {
                                continue
                            }

                            let cellPosition = new Position(x, y)

                            focusToCell(cellPosition)
                            await sleep(25);

                            if (checkConflictsByRowAndCellAndGroup(cellPosition, digit.toString())) {
                                possiblePositionsInGroup.push(cellPosition)
                            }
                        }
                    }

                    if (possiblePositionsInGroup.length == 1) {
                        focusToCell(possiblePositionsInGroup[0])
                        await sleep(250);
                        setCellValue(possiblePositionsInGroup[0], digit.toString(), true)
                        somethingChanged = true
                    }
                }
            }

            if (!hasEmptyCells()) {
                break
            }
        }
        // endregion

        if (!somethingChanged) {
            break
        }
    }

    solveBtn.disabled = false
    resetBtn.disabled = false
    fillDemoBtn.disabled = false
}

const app = document.getElementById('app') as HTMLTableElement
const resetBtn = new Button('reset_btn')
const solveBtn = new Button('solve_btn')
const fillDemoBtn = new Button('fill_demo_btn')

function hydrate() { // Hydrate
    // region Fill table
    for (let r: number = 0; r < 9; r++) {
        let tableRow: HTMLTableRowElement = document.createElement('tr')

        for (let c: number = 0; c < 9; c++) {
            let tableCell: HTMLTableCellElement = document.createElement('td')

            tableCell.addEventListener('click', () => {
                if (!solveBtn.disabled) {
                    focusToCell(new Position(c, r))
                }
            })
            tableRow.appendChild(tableCell)
        }

        app.querySelector('tbody').appendChild(tableRow)
    }

    focusToCell();
    // endregion

    // region Bind keyboard
    window.addEventListener('keyup', (e: KeyboardEvent) => {
        if (solveBtn.disabled)
            return;


        let code: Key = Key[e.code]

        if (DIGITS.indexOf(e.key) != -1) {
            fillCurrentCell(e.key)
        } else if (code == Key.Backspace || code == Key.Delete) {
            fillCurrentCell()
        } else if (code == Key.Enter || code == Key.Space || code == Key.NumpadEnter) {
            let currentPosition = getFocusedCellPosition();

            if (currentPosition) {
                let toPosition = currentPosition;
                let inRectPosition = new Position(
                    (currentPosition.x % GROUP_WIDTH) + 1,
                    (currentPosition.y % GROUP_HEIGHT) + 1
                )

                if (inRectPosition.x == GROUP_WIDTH) {
                    if (inRectPosition.y == GROUP_HEIGHT) {
                        if (Math.floor(currentPosition.x / GROUP_WIDTH) == (AREA_WIDTH / GROUP_WIDTH - 1)) {
                            if (currentPosition.x == AREA_WIDTH - 1 && currentPosition.y == AREA_HEIGHT - 1) {
                                toPosition.x = 0
                                toPosition.y = 0
                            } else {
                                toPosition.x = 0
                                toPosition.y += 1
                            }
                        } else {
                            toPosition.x += 1
                            toPosition.y -= GROUP_HEIGHT - 1
                        }
                    } else {
                        toPosition.x -= GROUP_WIDTH - 1
                        toPosition.y += 1
                    }
                } else {
                    toPosition.x += 1
                }

                focusToCell(toPosition)
            }
        } else if ([Key.ArrowLeft, Key.ArrowUp, Key.ArrowRight, Key.ArrowDown].indexOf(code) != -1) {
            let toPosition = getFocusedCellPosition();

            if (!toPosition) {
                toPosition = new Position(0, 0);
            } else {
                if (code == Key.ArrowRight || code == Key.ArrowLeft) {
                    toPosition.x = (toPosition.x + (code == Key.ArrowRight ? 1 : AREA_WIDTH - 1)) % AREA_WIDTH
                } else {
                    toPosition.y = (toPosition.y + (code == Key.ArrowDown ? 1 : AREA_HEIGHT - 1)) % AREA_HEIGHT
                }
            }

            focusToCell(toPosition)
        } else {
            return
        }

        beep()
    })
    // endregion

    // region Bind buttons
    fillDemoBtn.bind(() => {
        fillAreaData(' 2 8741  13  2  89   9  725 5 2    824635 9   9 167 425       73 259    419  3 56')
    })
    solveBtn.bind(solveArea)
    resetBtn.bind(resetArea)
    // endregion
}

hydrate()
