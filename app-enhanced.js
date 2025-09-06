// Enhanced DeFi Drag & Drop Dashboard - Full Featured Application

class DeFiDashboard {
    constructor() {
        this.canvas = document.getElementById('workflowCanvas');
        this.executeBtn = document.getElementById('executeBtn');
        this.connectWalletBtn = document.getElementById('connectWallet');
        this.walletInfo = document.getElementById('walletInfo');
        this.blockCount = document.getElementById('blockCount');
        this.gasEstimate = document.getElementById('gasEstimate');
        this.transactionSummary = document.getElementById('transactionSummary');
        this.executionStatus = document.getElementById('executionStatus');
        this.flowLines = document.getElementById('flowLines');

        this.droppedBlocks = [];
        this.isWalletConnected = false;
        this.draggedElement = null;
        this.blockCounter = 0;
        this.gasPrice = 20; // Gwei

        // Mock wallet data
        this.walletData = {
            address: '0x742d35Cc6335C0532FCD3aa48F9b5a555156c96B2',
            balance: 5.24,
            tokens: {
                'ETH': 5.24,
                'DAI': 1250.00,
                'USDC': 800.00,
                'WBTC': 0.05,
                'LINK': 100.00,
                'UNI': 150.00
            }
        };

        // Token prices (mock real-time data)
        this.tokenPrices = {
            'ETH': 2450,
            'DAI': 1.00,
            'USDC': 1.00,
            'WBTC': 42500,
            'LINK': 15.20,
            'UNI': 8.45
        };

        // Protocol data
        this.protocolData = {
            'MakerDAO': { apy: '5.2%', tvl: '$8.5B', risk: 'Low' },
            'Compound': { apy: '3.8%', tvl: '$2.1B', risk: 'Low' },
            'Aave': { apy: '4.5%', tvl: '$12.3B', risk: 'Medium' },
            'Uniswap': { apy: 'Variable', tvl: '$5.8B', risk: 'High' },
            'Curve': { apy: '12.5%', tvl: '$4.2B', risk: 'Medium' },
            'Yearn': { apy: '18.3%', tvl: '$890M', risk: 'High' }
        };

        this.init();
    }

    init() {
        this.setupDragAndDrop();
        this.setupEventListeners();
        this.updateUI();
        this.loadTokenPrices();
        this.startPriceUpdates();
    }

    setupDragAndDrop() {
        // Add drag start event to all draggable blocks
        const draggableBlocks = document.querySelectorAll('.draggable-block');
        draggableBlocks.forEach(block => {
            block.addEventListener('dragstart', this.handleDragStart.bind(this));
            block.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        // Canvas drop events
        this.canvas.addEventListener('dragover', this.handleDragOver.bind(this));
        this.canvas.addEventListener('drop', this.handleDrop.bind(this));
        this.canvas.addEventListener('dragenter', this.handleDragEnter.bind(this));
        this.canvas.addEventListener('dragleave', this.handleDragLeave.bind(this));
    }

    setupEventListeners() {
        this.executeBtn.addEventListener('click', this.executeTransaction.bind(this));
        this.connectWalletBtn.addEventListener('click', this.toggleWalletConnection.bind(this));

        // Control buttons
        const saveBtn = document.getElementById('saveWorkflow');
        const loadBtn = document.getElementById('loadWorkflow');
        const clearBtn = document.getElementById('clearCanvas');
        const validateBtn = document.getElementById('validateFlow');
        const previewBtn = document.getElementById('previewTransaction');

        if (saveBtn) saveBtn.addEventListener('click', this.saveWorkflow.bind(this));
        if (loadBtn) loadBtn.addEventListener('click', this.loadWorkflow.bind(this));
        if (clearBtn) clearBtn.addEventListener('click', this.clearCanvas.bind(this));
        if (validateBtn) validateBtn.addEventListener('click', this.validateAndShowFlow.bind(this));
        if (previewBtn) previewBtn.addEventListener('click', this.previewTransaction.bind(this));
    }

    loadTokenPrices() {
        // Update token prices in the UI
        const tokens = document.querySelectorAll('.token');
        tokens.forEach(token => {
            const tokenName = token.dataset.name;
            const price = this.tokenPrices[tokenName];
            if (price) {
                const priceSpan = token.querySelector('.token-price');
                if (priceSpan) {
                    priceSpan.textContent = `$${price >= 1000 ? price.toLocaleString() : price.toFixed(2)}`;
                }
            }
        });
    }

    startPriceUpdates() {
        // Simulate real-time price updates
        setInterval(() => {
            Object.keys(this.tokenPrices).forEach(token => {
                const change = (Math.random() - 0.5) * 0.02; // ±1% random change
                this.tokenPrices[token] *= (1 + change);
            });
            this.loadTokenPrices();
            this.updateGasEstimate();
        }, 5000);
    }

    handleDragStart(e) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');

        // Store drag data with enhanced information
        const blockData = {
            type: e.target.dataset.type,
            name: e.target.dataset.name,
            icon: e.target.dataset.icon || '',
            price: e.target.dataset.price || ''
        };

        e.dataTransfer.setData('text/plain', JSON.stringify(blockData));
        e.dataTransfer.effectAllowed = 'copy';

        this.trackUserAction('drag_start', blockData);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedElement = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleDragEnter(e) {
        e.preventDefault();
        this.canvas.classList.add('drag-over');
    }

    handleDragLeave(e) {
        if (!this.canvas.contains(e.relatedTarget)) {
            this.canvas.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        this.canvas.classList.remove('drag-over');

        try {
            const blockData = JSON.parse(e.dataTransfer.getData('text/plain'));
            this.addBlockToCanvas(blockData, e.clientX, e.clientY);
        } catch (error) {
            console.error('Error parsing drag data:', error);
            this.showNotification('Error adding block to canvas', 'error');
        }
    }

    addBlockToCanvas(blockData, x, y) {
        const blockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.blockCounter++;

        const blockElement = document.createElement('div');
        blockElement.className = `dropped-block ${blockData.type}`;
        blockElement.setAttribute('data-block-id', blockId);
        blockElement.setAttribute('data-type', blockData.type);
        blockElement.setAttribute('data-name', blockData.name);

        // Enhanced block content based on type
        let blockContent = `
            <div class="block-icon">${blockData.icon}</div>
            <div class="block-type">${blockData.type}</div>
            <div class="block-name">${blockData.name}</div>
        `;

        // Add type-specific content
        if (blockData.type === 'token') {
            blockContent += `
                <input type="number" class="amount-input" placeholder="Amount" min="0" step="0.01">
                <div class="block-details">${blockData.price}</div>
            `;
        } else if (blockData.type === 'protocol') {
            const protocolInfo = this.protocolData[blockData.name];
            if (protocolInfo) {
                blockContent += `<div class="block-details">APY: ${protocolInfo.apy}</div>`;
            }
        }

        blockContent += `<button class="remove-btn" onclick="defiDashboard.removeBlock('${blockId}')">×</button>`;

        blockElement.innerHTML = blockContent;

        // Add to canvas
        this.canvas.appendChild(blockElement);

        // Store in droppedBlocks array with enhanced data
        this.droppedBlocks.push({
            id: blockId,
            type: blockData.type,
            name: blockData.name,
            element: blockElement,
            timestamp: Date.now(),
            position: { x: this.blockCounter * 160, y: Math.floor(this.blockCounter / 5) * 80 }
        });

        // Update UI and state
        this.updateUI();
        this.updateTransactionSummary();
        this.drawFlowLines();

        // Add success animation
        blockElement.classList.add('success-animation');
        setTimeout(() => blockElement.classList.remove('success-animation'), 1500);

        console.log(`✅ Added ${blockData.type}: ${blockData.name} to canvas`);
        this.trackUserAction('block_added', blockData);
    }

    removeBlock(blockId) {
        const blockIndex = this.droppedBlocks.findIndex(block => block.id === blockId);
        if (blockIndex > -1) {
            const block = this.droppedBlocks[blockIndex];
            block.element.remove();
            this.droppedBlocks.splice(blockIndex, 1);

            this.updateUI();
            this.updateTransactionSummary();
            this.drawFlowLines();

            console.log(`🗑️ Removed block: ${block.name}`);
            this.trackUserAction('block_removed', { name: block.name, type: block.type });
        }
    }

    updateUI() {
        // Update canvas state
        if (this.droppedBlocks.length > 0) {
            this.canvas.classList.add('has-blocks');
        } else {
            this.canvas.classList.remove('has-blocks');
        }

        // Update stats
        if (this.blockCount) {
            this.blockCount.textContent = this.droppedBlocks.length;
        }

        this.updateGasEstimate();
        this.updateExecuteButton();
    }

    updateGasEstimate() {
        const baseGas = 21000;
        const gasPerBlock = 50000;
        const totalGas = baseGas + (this.droppedBlocks.length * gasPerBlock);
        const gasCostEth = (totalGas * this.gasPrice) / 1e9; // Convert from Gwei to ETH

        if (this.gasEstimate) {
            this.gasEstimate.textContent = `${gasCostEth.toFixed(4)} ETH`;
        }
    }

    updateExecuteButton() {
        const hasBlocks = this.droppedBlocks.length > 0;
        const hasValidFlow = this.validateTransactionFlow();

        this.executeBtn.disabled = !hasBlocks || !hasValidFlow || !this.isWalletConnected;

        let statusText = 'Ready to execute';
        let buttonText = 'Execute Transaction';

        if (!this.isWalletConnected) {
            statusText = 'Connect wallet to continue';
            buttonText = 'Connect Wallet First';
        } else if (!hasBlocks) {
            statusText = 'Add blocks to build transaction';
            buttonText = 'Add Blocks to Execute';
        } else if (!hasValidFlow) {
            statusText = 'Need Protocol + Action + Token';
            buttonText = 'Invalid Transaction Flow';
        } else {
            statusText = `Ready to execute with ${this.droppedBlocks.length} blocks`;
            buttonText = 'Execute Transaction';
        }

        this.executeBtn.textContent = buttonText;
        if (this.executionStatus) {
            this.executionStatus.textContent = statusText;
        }
    }

    validateTransactionFlow() {
        if (this.droppedBlocks.length === 0) return false;

        const hasProtocol = this.droppedBlocks.some(block => block.type === 'protocol');
        const hasAction = this.droppedBlocks.some(block => block.type === 'action');
        const hasToken = this.droppedBlocks.some(block => block.type === 'token');

        return hasProtocol && hasAction && hasToken;
    }

    validateAndShowFlow() {
        const isValid = this.validateTransactionFlow();
        const protocols = this.droppedBlocks.filter(block => block.type === 'protocol').length;
        const actions = this.droppedBlocks.filter(block => block.type === 'action').length;
        const tokens = this.droppedBlocks.filter(block => block.type === 'token').length;

        let message = `Flow Analysis:\n`;
        message += `✅ Protocols: ${protocols}\n`;
        message += `✅ Actions: ${actions}\n`;
        message += `✅ Tokens: ${tokens}\n`;
        message += `\nStatus: ${isValid ? '✅ Valid Flow' : '❌ Invalid Flow'}`;

        if (!isValid) {
            message += `\nNeed at least: 1 Protocol + 1 Action + 1 Token`;
        }

        this.showNotification(message.replace(/\n/g, ' | '), isValid ? 'success' : 'error');
        console.log(message);
    }

    previewTransaction() {
        if (!this.validateTransactionFlow()) {
            this.showNotification('Cannot preview invalid transaction flow', 'error');
            return;
        }

        const flow = this.buildTransactionFlow();
        this.showTransactionPreview(flow);
    }

    showTransactionPreview(flow) {
        const preview = `
            🔍 Transaction Preview:
            📊 Protocols: ${flow.protocols.join(', ')}
            🪙 Tokens: ${flow.tokens.join(', ')}
            ⚡ Actions: ${flow.actions.join(', ')}
            ⛽ Gas: ~${(Math.random() * 0.1 + 0.02).toFixed(4)} ETH
            💰 Value: ${(Math.random() * 1000 + 100).toFixed(2)} USD
        `;

        console.log(preview);
        this.showNotification('Transaction preview logged to console', 'info');
    }

    updateTransactionSummary() {
        if (!this.transactionSummary) return;

        const summaryContent = this.transactionSummary.querySelector('.summary-content');
        if (!summaryContent) return;

        if (this.droppedBlocks.length === 0) {
            summaryContent.innerHTML = '<p>No transaction configured yet</p>';
            return;
        }

        const protocols = this.droppedBlocks.filter(block => block.type === 'protocol');
        const tokens = this.droppedBlocks.filter(block => block.type === 'token');
        const actions = this.droppedBlocks.filter(block => block.type === 'action');

        let html = '<div class="summary-items">';

        if (protocols.length > 0) {
            html += `<div class="summary-item">
                <span>Protocols:</span>
                <span>${protocols.map(p => p.name).join(', ')}</span>
            </div>`;
        }

        if (tokens.length > 0) {
            html += `<div class="summary-item">
                <span>Tokens:</span>
                <span>${tokens.map(t => t.name).join(', ')}</span>
            </div>`;
        }

        if (actions.length > 0) {
            html += `<div class="summary-item">
                <span>Actions:</span>
                <span>${actions.map(a => a.name).join(', ')}</span>
            </div>`;
        }

        html += `<div class="summary-item">
            <span>Status:</span>
            <span class="${this.validateTransactionFlow() ? 'valid' : 'invalid'}">
                ${this.validateTransactionFlow() ? '✅ Ready' : '❌ Incomplete'}
            </span>
        </div>`;

        html += '</div>';
        summaryContent.innerHTML = html;
    }

    drawFlowLines() {
        if (!this.flowLines) return;

        // Clear existing lines
        this.flowLines.innerHTML = '';

        if (this.droppedBlocks.length < 2) return;

        // Draw connection lines between blocks
        for (let i = 0; i < this.droppedBlocks.length - 1; i++) {
            const line = document.createElement('div');
            line.className = 'flow-line';
            line.style.cssText = `
                left: ${(i + 1) * 160}px;
                top: 50%;
                width: 140px;
            `;
            this.flowLines.appendChild(line);
        }
    }

    toggleWalletConnection() {
        if (!this.isWalletConnected) {
            this.connectWallet();
        } else {
            this.disconnectWallet();
        }
    }

    async connectWallet() {
        console.log('🔌 Connecting to wallet...');
        this.connectWalletBtn.classList.add('loading');
        this.connectWalletBtn.textContent = 'Connecting...';

        try {
            // Simulate wallet connection process
            await this.delay(1500);

            this.isWalletConnected = true;
            this.connectWalletBtn.classList.remove('loading');
            this.connectWalletBtn.classList.add('connected');
            this.connectWalletBtn.textContent = '✅ Connected';

            // Show wallet info
            if (this.walletInfo) {
                this.walletInfo.classList.remove('hidden');
                this.walletInfo.querySelector('.wallet-address').textContent =
                    this.walletData.address.slice(0, 6) + '...' + this.walletData.address.slice(-4);
                this.walletInfo.querySelector('.wallet-balance').textContent =
                    `Balance: ${this.walletData.balance.toFixed(2)} ETH`;
            }

            this.updateUI();
            this.showNotification(`Wallet connected: ${this.walletData.address.slice(0, 6)}...${this.walletData.address.slice(-4)}`, 'success');

            console.log('✅ Wallet connected successfully');
            this.trackUserAction('wallet_connected', { address: this.walletData.address });

        } catch (error) {
            console.error('❌ Wallet connection failed:', error);
            this.showNotification('Wallet connection failed', 'error');
            this.connectWalletBtn.classList.remove('loading');
            this.connectWalletBtn.textContent = 'Connect Wallet';
        }
    }

    disconnectWallet() {
        this.isWalletConnected = false;
        this.connectWalletBtn.classList.remove('connected');
        this.connectWalletBtn.textContent = 'Connect Wallet';

        if (this.walletInfo) {
            this.walletInfo.classList.add('hidden');
        }

        this.updateUI();
        this.showNotification('Wallet disconnected', 'info');

        console.log('🔌 Wallet disconnected');
        this.trackUserAction('wallet_disconnected', {});
    }

    async executeTransaction() {
        if (!this.validateTransactionFlow() || !this.isWalletConnected) {
            this.showNotification('Invalid transaction setup', 'error');
            return;
        }

        console.log('🚀 Executing DeFi transaction...');
        this.executeBtn.classList.add('loading');
        this.executeBtn.textContent = 'Executing...';

        if (this.executionStatus) {
            this.executionStatus.textContent = 'Executing transaction...';
        }

        try {
            // Build enhanced transaction flow
            const transactionFlow = this.buildTransactionFlow();
            console.log('📋 Transaction Flow:', transactionFlow);

            // Execute with InstaDApp DSA
            await this.executeWithInstaDAppDSA(transactionFlow);

            this.showNotification('🎉 Transaction executed successfully!', 'success');
            this.trackUserAction('transaction_executed', transactionFlow);

        } catch (error) {
            console.error('❌ Transaction execution failed:', error);
            this.showNotification(`Transaction failed: ${error.message}`, 'error');
            this.trackUserAction('transaction_failed', { error: error.message });
        } finally {
            this.executeBtn.classList.remove('loading');
            this.updateUI();
        }
    }

    buildTransactionFlow() {
        const protocols = this.droppedBlocks.filter(block => block.type === 'protocol');
        const tokens = this.droppedBlocks.filter(block => block.type === 'token');
        const actions = this.droppedBlocks.filter(block => block.type === 'action');

        // Get amounts from token inputs
        const tokenAmounts = {};
        tokens.forEach(token => {
            const input = token.element.querySelector('.amount-input');
            tokenAmounts[token.name] = input ? parseFloat(input.value) || 1.0 : 1.0;
        });

        return {
            protocols: protocols.map(p => p.name),
            tokens: tokens.map(t => t.name),
            actions: actions.map(a => a.name),
            tokenAmounts,
            estimatedGas: this.calculateGasEstimate(),
            estimatedValue: this.calculateTransactionValue(),
            timestamp: Date.now(),
            walletAddress: this.walletData.address,
            blockOrder: this.droppedBlocks.map(b => ({ type: b.type, name: b.name }))
        };
    }

    calculateGasEstimate() {
        const baseGas = 21000;
        const gasPerOperation = {
            'protocol': 100000,
            'token': 50000,
            'action': 75000
        };

        let totalGas = baseGas;
        this.droppedBlocks.forEach(block => {
            totalGas += gasPerOperation[block.type] || 50000;
        });

        return totalGas;
    }

    calculateTransactionValue() {
        let totalValue = 0;
        const tokens = this.droppedBlocks.filter(block => block.type === 'token');

        tokens.forEach(token => {
            const amount = this.getTokenAmount(token.element);
            const price = this.tokenPrices[token.name] || 0;
            totalValue += amount * price;
        });

        return totalValue;
    }

    getTokenAmount(tokenElement) {
        const input = tokenElement.querySelector('.amount-input');
        return input ? parseFloat(input.value) || 1.0 : 1.0;
    }

    async executeWithInstaDAppDSA(transactionFlow) {
        console.log('🏗️ Mock InstaDApp DSA Integration Started');

        // Step 1: Connect to DSA
        await this.delay(800);
        console.log('🔗 Connected to DSA Account: 0xDSA123456789...');

        // Step 2: Build DSA Spell
        await this.delay(1200);
        console.log('🪄 Building DSA Spell...');

        const mockSpell = this.buildEnhancedDSASpell(transactionFlow);
        console.log('📜 Enhanced DSA Spell:', mockSpell);

        // Step 3: Simulate transaction steps
        await this.delay(1000);
        console.log('🔍 Validating transaction parameters...');

        await this.delay(800);
        console.log('⛽ Estimating gas costs...');
        console.log(`💸 Gas estimate: ${(transactionFlow.estimatedGas / 1000000).toFixed(2)}M units (${this.gasEstimate.textContent})`);

        await this.delay(1200);
        console.log('📊 Checking protocol liquidity...');

        // Step 4: Execute transaction
        await this.delay(1500);
        console.log('📝 Submitting transaction to blockchain...');

        const txHash = '0x' + this.generateMockTxHash();
        console.log('🔗 Transaction hash:', txHash);

        await this.delay(2000);
        console.log('⏳ Waiting for confirmation...');

        await this.delay(1500);
        console.log('✅ Transaction confirmed!');
        console.log('💰 Transaction value:', `$${transactionFlow.estimatedValue.toFixed(2)}`);

        // Update UI with success animation
        this.droppedBlocks.forEach((block, index) => {
            setTimeout(() => {
                block.element.classList.add('success-animation');
            }, index * 200);
        });

        // Show final success message
        setTimeout(() => {
            console.log('🎊 DeFi transaction completed successfully!');
            console.log('📈 Portfolio updated with new positions');
        }, 1000);
    }

    buildEnhancedDSASpell(flow) {
        const spells = [];

        // Create spells for each action
        flow.actions.forEach((action, index) => {
            const protocol = flow.protocols[index % flow.protocols.length];
            const token = flow.tokens[index % flow.tokens.length];
            const amount = flow.tokenAmounts[token] || 1.0;

            spells.push({
                connector: `${protocol.toLowerCase()}_v2`,
                method: this.getMethodName(action, protocol),
                args: [
                    token,
                    this.toWei(amount).toString(),
                    '0', // slippage tolerance
                    '0', // getId
                    '0'  // setId
                ]
            });
        });

        return {
            spells,
            origin: 'defi-drag-drop-composer-v2',
            metadata: {
                protocols: flow.protocols,
                tokens: flow.tokens,
                actions: flow.actions,
                estimatedGas: flow.estimatedGas,
                estimatedValue: flow.estimatedValue,
                walletAddress: flow.walletAddress,
                timestamp: flow.timestamp
            },
            gasLimit: flow.estimatedGas.toString(),
            gasPrice: (this.gasPrice * 1e9).toString() // Convert Gwei to Wei
        };
    }

    getMethodName(action, protocol) {
        const methodMap = {
            'Deposit': 'deposit',
            'Borrow': 'borrow',
            'Swap': 'sell',
            'Repay': 'payback',
            'Withdraw': 'withdraw',
            'Stake': 'stake'
        };

        return methodMap[action] || action.toLowerCase();
    }

    toWei(amount, decimals = 18) {
        return Math.floor(amount * Math.pow(10, decimals));
    }

    generateMockTxHash() {
        return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const colors = {
            success: { bg: 'rgba(0, 255, 127, 0.2)', border: '#00ff7f', color: '#00ff7f' },
            error: { bg: 'rgba(255, 107, 107, 0.2)', border: '#ff6b6b', color: '#ff6b6b' },
            info: { bg: 'rgba(100, 255, 218, 0.2)', border: '#64ffda', color: '#64ffda' }
        };

        const style = colors[type] || colors.info;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${style.bg};
            border: 1px solid ${style.border};
            border-radius: 12px;
            padding: 15px 20px;
            color: ${style.color};
            z-index: 1000;
            backdrop-filter: blur(10px);
            animation: slideIn 0.3s ease;
            max-width: 300px;
            font-size: 0.9rem;
            line-height: 1.4;
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        // Auto-remove notification
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, type === 'error' ? 5000 : 3000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Workflow Management
    saveWorkflow() {
        const workflow = {
            blocks: this.droppedBlocks.map(block => ({
                type: block.type,
                name: block.name,
                position: block.position
            })),
            metadata: {
                version: '2.0',
                createdAt: Date.now(),
                totalBlocks: this.droppedBlocks.length,
                isValid: this.validateTransactionFlow()
            }
        };

        localStorage.setItem('defi-workflow-v2', JSON.stringify(workflow));
        this.showNotification('💾 Workflow saved successfully!', 'success');

        console.log('💾 Workflow saved:', workflow);
        this.trackUserAction('workflow_saved', { blockCount: this.droppedBlocks.length });
    }

    loadWorkflow() {
        const savedWorkflow = localStorage.getItem('defi-workflow-v2');
        if (!savedWorkflow) {
            this.showNotification('No saved workflow found', 'info');
            return;
        }

        try {
            const workflow = JSON.parse(savedWorkflow);

            // Clear current canvas
            this.clearCanvas();

            // Add saved blocks with animation
            workflow.blocks.forEach((blockData, index) => {
                setTimeout(() => {
                    this.addBlockToCanvas(blockData,
                        blockData.position?.x || 100 + (index * 10),
                        blockData.position?.y || 100 + (index * 10)
                    );
                }, index * 200);
            });

            this.showNotification(`📂 Loaded workflow with ${workflow.blocks.length} blocks`, 'success');
            console.log('📂 Workflow loaded:', workflow);
            this.trackUserAction('workflow_loaded', { blockCount: workflow.blocks.length });

        } catch (error) {
            console.error('Failed to load workflow:', error);
            this.showNotification('Failed to load workflow', 'error');
        }
    }

    clearCanvas() {
        // Animate blocks removal
        this.droppedBlocks.forEach((block, index) => {
            setTimeout(() => {
                block.element.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    block.element.remove();
                }, 300);
            }, index * 100);
        });

        // Clear arrays after animation
        setTimeout(() => {
            this.droppedBlocks = [];
            this.blockCounter = 0;
            this.updateUI();
            this.updateTransactionSummary();
            if (this.flowLines) this.flowLines.innerHTML = '';

            this.showNotification('🗑️ Canvas cleared', 'info');
            this.trackUserAction('canvas_cleared', {});
        }, this.droppedBlocks.length * 100 + 300);
    }

    // Analytics and tracking
    trackUserAction(action, data) {
        const analyticsData = {
            action,
            data,
            timestamp: Date.now(),
            sessionId: this.getSessionId(),
            walletConnected: this.isWalletConnected,
            blockCount: this.droppedBlocks.length
        };

        console.log(`📊 Analytics: ${action}`, analyticsData);

        // In production, this would send to analytics service
        // analytics.track(action, analyticsData);
    }

    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.sessionId;
    }

    // Enhanced features for future development
    exportWorkflow() {
        const workflow = this.buildTransactionFlow();
        const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `defi-workflow-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('📥 Workflow exported', 'success');
    }

    importWorkflow(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workflow = JSON.parse(e.target.result);
                // Process imported workflow
                this.showNotification('📤 Workflow imported', 'success');
            } catch (error) {
                this.showNotification('Failed to import workflow', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Enhanced CSS animations
const enhancedStyle = document.createElement('style');
enhancedStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.8); }
    }
    
    @keyframes flowPulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
    }
    
    .summary-item .valid { color: #00ff7f; }
    .summary-item .invalid { color: #ff6b6b; }
`;
document.head.appendChild(enhancedStyle);

// Initialize the enhanced dashboard
let defiDashboard;
document.addEventListener('DOMContentLoaded', () => {
    defiDashboard = new DeFiDashboard();
    console.log('🎉 Enhanced DeFi Drag & Drop Dashboard initialized!');
    console.log('✨ New features: Real-time prices, enhanced UI, workflow management');
    console.log('💡 Try dragging protocols, tokens, and actions to build complex DeFi strategies');
    console.log('🔗 Connect your wallet and execute multi-protocol transactions');
});

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 's':
                e.preventDefault();
                defiDashboard.saveWorkflow();
                break;
            case 'l':
                e.preventDefault();
                defiDashboard.loadWorkflow();
                break;
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                defiDashboard.clearCanvas();
                break;
            case 'e':
                e.preventDefault();
                if (defiDashboard.validateTransactionFlow() && defiDashboard.isWalletConnected) {
                    defiDashboard.executeTransaction();
                }
                break;
            case 'r':
                e.preventDefault();
                defiDashboard.previewTransaction();
                break;
        }
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeFiDashboard;
}
