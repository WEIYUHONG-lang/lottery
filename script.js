class LotterySystem {
    constructor() {
        this.nameList = [];
        this.originalNameList = [];
        this.prizes = [];
        this.isRolling = false;
        this.currentInterval = null;
        this.winners = new Map();
        this.currentPrize = null;
        this.currentPrizeWinners = [];
        this.startSound = document.getElementById('startSound');
        this.winSound = document.getElementById('winSound');
        
        this.initializeElements();
        this.bindEvents();
        this.loadSavedData();
        this.startClock();
        this.updateStats();
        this.createSnowflakes();
    }

    initializeElements() {
        this.fileInput = document.getElementById('nameList');
        this.nameInput = document.getElementById('nameInput');
        this.confirmNamesBtn = document.getElementById('confirmNames');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.nameDisplay = document.getElementById('nameDisplay');
        this.resultList = document.getElementById('resultList');
        this.addPrizeBtn = document.querySelector('.add-prize');
        this.prizeInputs = document.querySelector('.prize-inputs');
        this.datetimeDisplay = document.getElementById('datetime');
        this.totalCountDisplay = document.getElementById('totalCount');
        this.winnerCountDisplay = document.getElementById('winnerCount');
        this.remainingCountDisplay = document.getElementById('remainingCount');
        this.rollingNames = document.getElementById('rollingNames');

        // 添加自动保存功能
        this.nameInput.addEventListener('input', () => {
            localStorage.setItem('savedNames', this.nameInput.value);
            this.updateStats();
        });
    }

    loadSavedData() {
        // 加载名单
        const savedNames = localStorage.getItem('savedNames');
        if (savedNames) {
            this.nameInput.value = savedNames;
            this.handleTextInput(false);
        }

        // 加载奖项
        const savedPrizes = localStorage.getItem('savedPrizes');
        if (savedPrizes) {
            const prizes = JSON.parse(savedPrizes);
            this.prizeInputs.innerHTML = ''; // 清空现有奖项
            
            prizes.forEach((prize, index) => {
                const prizeInput = document.createElement('div');
                prizeInput.className = 'prize-input';
                prizeInput.innerHTML = `
                    <input type="text" placeholder="奖项名称" class="prize-name" value="${prize.name}">
                    <input type="number" placeholder="人数" min="1" class="prize-count" value="${prize.count}">
                    <button class="add-prize">${index === prizes.length - 1 ? '+' : '-'}</button>
                `;
                
                this.prizeInputs.appendChild(prizeInput);
                
                const button = prizeInput.querySelector('.add-prize');
                if (index === prizes.length - 1) {
                    button.onclick = () => this.addPrizeInput();
                } else {
                    button.onclick = () => prizeInput.remove();
                }
            });
        }
    }

    savePrizes() {
        const inputs = this.prizeInputs.querySelectorAll('.prize-input');
        const prizes = [];
        
        inputs.forEach(input => {
            const name = input.querySelector('.prize-name').value.trim();
            const count = input.querySelector('.prize-count').value;
            if (name && count) {
                prizes.push({ name, count: parseInt(count) });
            }
        });

        localStorage.setItem('savedPrizes', JSON.stringify(prizes));
    }

    bindEvents() {
        this.fileInput.addEventListener('change', this.handleFileUpload.bind(this));
        this.confirmNamesBtn.addEventListener('click', () => this.handleTextInput(true));
        this.startBtn.addEventListener('click', this.startLottery.bind(this));
        this.stopBtn.addEventListener('click', this.stopLottery.bind(this));
        this.addPrizeBtn.addEventListener('click', this.addPrizeInput.bind(this));
    }

    handleTextInput(showAlert = true) {
        const text = this.nameInput.value.trim();
        if (!text) {
            if (showAlert) alert('请输入名单');
            return;
        }
        
        this.nameList = text.split(/\r?\n/).filter(name => name.trim());
        this.originalNameList = [...this.nameList]; // 保存原始名单
        
        if (this.nameList.length === 0) {
            if (showAlert) alert('请输入有效的名单');
            return;
        }
        
        if (showAlert) alert(`成功导入${this.nameList.length}个名字`);
        localStorage.setItem('savedNames', text);
        this.updateStats();
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            this.nameInput.value = text; // 将文件内容显示在文本框中
            this.handleTextInput(true);
        } catch (error) {
            alert('文件读取失败，请重试');
            console.error(error);
        }
    }

    addPrizeInput() {
        const prizeInput = document.createElement('div');
        prizeInput.className = 'prize-input';
        prizeInput.innerHTML = `
            <input type="text" placeholder="奖项名称" class="prize-name">
            <input type="number" placeholder="人数" min="1" class="prize-count">
            <button class="add-prize">+</button>
        `;

        const lastInput = this.prizeInputs.lastElementChild;
        if (lastInput) {
            const lastButton = lastInput.querySelector('.add-prize');
            lastButton.textContent = '-';
            lastButton.onclick = () => {
                lastInput.remove();
            };
        }

        this.prizeInputs.appendChild(prizeInput);
        const newButton = prizeInput.querySelector('.add-prize');
        newButton.onclick = () => this.addPrizeInput();
    }

    validatePrizes() {
        const inputs = this.prizeInputs.querySelectorAll('.prize-input');
        this.prizes = [];
        
        for (const input of inputs) {
            const nameInput = input.querySelector('.prize-name');
            const countInput = input.querySelector('.prize-count');
            const name = nameInput.value.trim();
            const count = parseInt(countInput.value);
            
            if (!name) {
                alert('请填写奖项名称');
                nameInput.focus();
                return false;
            }
            
            if (!countInput.value || isNaN(count) || count < 1) {
                alert('请填写有效的中奖人数（必须大于0）');
                countInput.focus();
                return false;
            }
            
            if (this.prizes.some(prize => prize.name === name)) {
                alert(`奖项"${name}"重复了，请修改`);
                nameInput.focus();
                return false;
            }
            
            this.prizes.push({ name, count });
        }

        if (this.prizes.length === 0) {
            alert('请至少添加一个奖项');
            return false;
        }

        const totalCount = this.prizes.reduce((sum, prize) => sum + prize.count, 0);
        if (totalCount > this.nameList.length) {
            alert(`奖项总人数(${totalCount})不能超过参与人数(${this.nameList.length})`);
            return false;
        }

        // 验证通过后保存奖项
        this.savePrizes();
        return true;
    }

    startClock() {
        const updateTime = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const date = now.getDate();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            
            this.datetimeDisplay.textContent = 
                `${year}年${month}月${date}日 ${hours}:${minutes}:${seconds}`;
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    updateStats() {
        const totalCount = this.originalNameList.length;
        const winnerCount = [...this.winners.values()].flat().length;
        const remainingCount = totalCount - winnerCount;

        this.totalCountDisplay.textContent = totalCount;
        this.winnerCountDisplay.textContent = winnerCount;
        this.remainingCountDisplay.textContent = remainingCount;
    }

    startNameListAnimation() {
        this.rollingNames.innerHTML = '';
        this.rollingNames.className = 'name-list rolling';
        
        // 创建多个名字元素用于滚动
        const availableNames = this.nameList.filter(name => 
            ![...this.winners.values()].flat().includes(name)
        );
        
        for (let i = 0; i < 5; i++) {
            const nameDiv = document.createElement('div');
            nameDiv.className = 'name-item';
            nameDiv.textContent = availableNames[Math.floor(Math.random() * availableNames.length)];
            this.rollingNames.appendChild(nameDiv);
        }
    }

    stopNameListAnimation() {
        this.rollingNames.className = 'name-list';
        this.rollingNames.innerHTML = '';
    }

    startLottery() {
        if (this.nameList.length === 0 && this.originalNameList.length > 0) {
            if (confirm('所有奖项已抽完，是否重新开始新一轮抽奖？')) {
                this.resetLottery();
            }
            return;
        }

        if (this.nameList.length === 0) {
            alert('请先导入名单');
            return;
        }

        if (!this.validatePrizes()) return;

        if (this.isRolling) return;

        // 如果没有当前奖项，获取新的奖项
        if (!this.currentPrize) {
            this.currentPrize = this.prizes.find(prize => !this.winners.has(prize.name));
            this.currentPrizeWinners = [];
        }

        if (!this.currentPrize) {
            if (confirm('所有奖项已抽完，是否重新开始新一轮抽奖？')) {
                this.resetLottery();
            }
            return;
        }

        // 检查当前奖项是否已抽完
        if (this.currentPrizeWinners.length >= this.currentPrize.count) {
            this.winners.set(this.currentPrize.name, [...this.currentPrizeWinners]);
            this.updateResults();
            this.currentPrize = this.prizes.find(prize => !this.winners.has(prize.name));
            this.currentPrizeWinners = [];
            
            if (!this.currentPrize) {
                alert('所有奖项已抽完！');
                this.startBtn.disabled = true;
                return;
            }
        }

        this.isRolling = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.nameDisplay.classList.add('rolling');

        // 过滤掉已中奖的人
        const availableNames = this.nameList.filter(name => 
            ![...this.winners.values()].flat().concat(this.currentPrizeWinners).includes(name)
        );

        if (availableNames.length === 0) {
            alert('已没有可抽取的人员！');
            this.startBtn.disabled = true;
            return;
        }

        this.currentInterval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * availableNames.length);
            this.nameDisplay.textContent = availableNames[randomIndex];
        }, 50);

        this.startNameListAnimation();
        
        // 显示当前奖项信息
        this.nameDisplay.innerHTML = `
            <div class="prize-info">正在抽取：${this.currentPrize.name} (${this.currentPrizeWinners.length + 1}/${this.currentPrize.count})</div>
            <div class="rolling-name">${availableNames[0]}</div>
        `;

        // 播放开始音效
        this.startSound.currentTime = 0;
        this.startSound.play().catch(e => console.log('Audio play failed:', e));
    }

    resetLottery() {
        this.nameList = [...this.originalNameList];
        this.winners.clear();
        this.currentPrize = null;
        this.currentPrizeWinners = [];
        this.updateResults();
        this.updateStats();
        this.startBtn.disabled = false;
        this.nameDisplay.textContent = '准备开始';
        this.stopNameListAnimation();
    }

    stopLottery() {
        if (!this.isRolling) return;

        clearInterval(this.currentInterval);
        this.isRolling = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.nameDisplay.classList.remove('rolling');

        // 获取一个中奖者
        const availableNames = this.nameList.filter(name => 
            ![...this.winners.values()].flat().concat(this.currentPrizeWinners).includes(name)
        );

        if (availableNames.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableNames.length);
            const winner = availableNames[randomIndex];
            this.currentPrizeWinners.push(winner);
            
            // 播放中奖音效
            this.winSound.currentTime = 0;
            this.winSound.play().catch(e => console.log('Audio play failed:', e));

            // 更新显示
            this.nameDisplay.innerHTML = `
                <div class="prize-info">${this.currentPrize.name} (${this.currentPrizeWinners.length}/${this.currentPrize.count})</div>
                <div class="winner-name">${winner}</div>
            `;

            // 如果当前奖项抽完了，保存结果
            if (this.currentPrizeWinners.length >= this.currentPrize.count) {
                this.winners.set(this.currentPrize.name, [...this.currentPrizeWinners]);
                this.updateResults();
                this.currentPrize = null;
                this.currentPrizeWinners = [];
                
                // 检查是否所有奖项都抽完了
                if (this.winners.size === this.prizes.length) {
                    this.startBtn.disabled = true;
                    setTimeout(() => alert('所有奖项已抽完！'), 100);
                }
            }
        }

        this.stopNameListAnimation();
        this.updateStats();
    }

    updateResults() {
        this.resultList.innerHTML = '';
        
        for (const [prizeName, winners] of this.winners) {
            const prizeResult = document.createElement('div');
            prizeResult.className = 'prize-result';
            prizeResult.innerHTML = `
                <div class="prize-title">${prizeName}</div>
                <div class="winner-list">${winners.join('、')}</div>
            `;
            this.resultList.appendChild(prizeResult);
        }
    }

    createSnowflakes() {
        const snowContainer = document.getElementById('snowContainer');
        const numberOfSnowflakes = 50;

        for (let i = 0; i < numberOfSnowflakes; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.textContent = '❄';
            snowflake.style.left = `${Math.random() * 100}vw`;
            snowflake.style.animationDuration = `${Math.random() * 3 + 2}s`;
            snowflake.style.opacity = Math.random();
            snowflake.style.fontSize = `${Math.random() * 10 + 10}px`;
            snowContainer.appendChild(snowflake);
        }
    }
}

// 初始化抽奖系统
document.addEventListener('DOMContentLoaded', () => {
    new LotterySystem();
}); 