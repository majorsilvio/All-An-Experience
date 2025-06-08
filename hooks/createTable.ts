class Controller {
	table: number[][];  // Main game board
	reset: number[][];  // Backup of initial game state
	count: number;       // Number of moves made

	constructor() {
		this.table = [];
		this.reset = [];
		this.count = 0;
	}

	endGame(): boolean {
		for (let i = 0; i < this.table.length; i++) {
			for (let j = 0; j < this.table[i].length; j++) {
				if (this.table[i][j]) {
					return false;
				}
			}
		}
		return true;
	}

	createTable(): void {
		this.table = Array(5).fill(0).map(() => Array(5).fill(0));
	}

	generateElements(): string {
		let element = '';
		for (let i = 0; i < this.table.length; i++) {
			for (let j = 0; j < this.table[i].length; j++) {
				if (this.table[i][j]) {
					element += `<a href="change/${i}/${j}"><div class="grid-item lit"></div></a>`;
				} else {
					element += `<a href="change/${i}/${j}"><div class="grid-item out"></div></a>`;
				}
			}
		}
		return element;
	}

	change(lin: number, col: number): void {
		const linToChange = [lin - 1, lin + 1];
		const colToChange = [col - 1, col + 1];

		for (let i = 0; i < linToChange.length; i++) {
			const row = linToChange[i];
			if (this.table[row]?.[col] !== undefined) {
				this.table[row][col] = this.table[row][col] === 1 ? 0 : 1;
			}
		}

		for (let i = 0; i < colToChange.length; i++) {
			const column = colToChange[i];
			if (this.table[lin]?.[column] !== undefined) {
				this.table[lin][column] = this.table[lin][column] === 1 ? 0 : 1;
			}
		}

		this.table[lin][col] = this.table[lin][col] === 1 ? 0 : 1;
		this.count++;
	}

	makeNivel(clicks: number): void {
		for (let i = 0; i < clicks; i++) {
			const lin = Math.floor(Math.random() * 5);
			const col = Math.floor(Math.random() * 5);
			this.change(lin, col);
		}
		this.makeReset();
	}

	makeReset(): void {
		this.reset = [];
		for (let i = 0; i < 5; i++) {
			this.reset[i] = [];
			for (let j = 0; j < 5; j++) {
				this.reset[i][j] = this.table[i][j];
			}
		}
	}

	resetNivel(): void {
		for (let i = 0; i < 5; i++) {
			for (let j = 0; j < 5; j++) {
				this.table[i][j] = this.reset[i][j];
			}
		}
	}
}
