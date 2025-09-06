// DeFi Drag & Drop Dashboard - JavaScript Logic

class DeFiDashboard {
    constructor() {
        this.canvas = document.getElementById('workflowCanvas');
        this.executeBtn = document.getElementById('executeBtn');
        this.connectWalletBtn = document.getElementById('connectWallet');
        this.droppedBlocks = [];
        this.isWalletConnected = false;
        this.draggedElement = null;

        this.init();
    }

    init() {
        this.setupDragAndDrop();
        this.setupEventListeners();
        this.updateExecuteButton();
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
    }

    handleDragStart(e) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');

        // Store drag data
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: e.target.dataset.type,
            name: e.target.dataset.name
        }));

        e.dataTransfer.effectAllowed = 'copy';
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
        }
    }

    addBlockToCanvas(blockData, x, y) {
        const blockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const blockElement = document.createElement('div');
        blockElement.className = `dropped-block ${blockData.type}`;
        blockElement.setAttribute('data-block-id', blockId);
        blockElement.setAttribute('data-type', blockData.type);
        blockElement.setAttribute('data-name', blockData.name);

        blockElement.innerHTML = `
            <div class="block-type">${blockData.type}</div>
            <div class="block-name">${blockData.name}</div>
            <button class="remove-btn" onclick="defiDashboard.removeBlock('${blockId}')">×</button>
        `;

        // Add to canvas
        this.canvas.appendChild(blockElement);

        // Store in droppedBlocks array
        this.droppedBlocks.push({
            id: blockId,
            type: blockData.type,
            name: blockData.name,
            element: blockElement
        });

        // Update canvas state
        this.updateCanvasState();
        this.updateExecuteButton();

        // Add success animation
        blockElement.classList.add('success-animation');
        setTimeout(() => blockElement.classList.remove('success-animation'), 1500);

        console.log(`Added ${blockData.type}: ${blockData.name} to canvas`);
    }

    removeBlock(blockId) {
        const blockIndex = this.droppedBlocks.findIndex(block => block.id === blockId);
        if (blockIndex > -1) {
            const block = this.droppedBlocks[blockIndex];
            block.element.remove();
            this.droppedBlocks.splice(blockIndex, 1);

            this.updateCanvasState();
            this.updateExecuteButton();

            console.log(`Removed block: ${block.name}`);
        }
    }

    updateCanvasState() {
        if (this.droppedBlocks.length > 0) {
            this.canvas.classList.add('has-blocks');
        } else {
            this.canvas.classList.remove('has-blocks');
        }
    }

    updateExecuteButton() {
        const hasBlocks = this.droppedBlocks.length > 0;
        const hasValidFlow = this.validateTransactionFlow();

        this.executeBtn.disabled = !hasBlocks || !hasValidFlow || !this.isWalletConnected;

        if (!this.isWalletConnected) {
            this.executeBtn.textContent = 'Connect Wallet First';
        } else if (!hasBlocks) {
            this.executeBtn.textContent = 'Add Blocks to Execute';
        } else if (!hasValidFlow) {
            this.executeBtn.textContent = 'Invalid Transaction Flow';
        } else {
            this.executeBtn.textContent = 'Execute Transaction';
        }
    }

    validateTransactionFlow() {
        if (this.droppedBlocks.length === 0) return false;

        const hasProtocol = this.droppedBlocks.some(block => block.type === 'protocol');
        const hasAction = this.droppedBlocks.some(block => block.type === 'action');
        const hasToken = this.droppedBlocks.some(block => block.type === 'token');

        return hasProtocol && hasAction && hasToken;
    }

    toggleWalletConnection() {
        if (!this.isWalletConnected) {
            this.connectWallet();
        } else {
            this.disconnectWallet();
        }
    }

    async connectWallet() {
        console.log('Connecting to wallet...');
        this.connectWalletBtn.classList.add('loading');
        this.connectWalletBtn.textContent = 'Connecting...';

        // Simulate wallet connection delay
        await this.delay(2000);

        this.isWalletConnected = true;
        this.connectWalletBtn.classList.remove('loading');
        this.connectWalletBtn.classList.add('connected');
        this.connectWalletBtn.textContent = 'Wallet Connected';

        this.updateExecuteButton();

        // Show mock wallet address
        this.showNotification('Wallet connected: 0x742d...96B2', 'success');

        console.log('Wallet connected successfully');
    }

    disconnectWallet() {
        this.isWalletConnected = false;
        this.connectWalletBtn.classList.remove('connected');
        this.connectWalletBtn.textContent = 'Connect Wallet';

        this.updateExecuteButton();
        this.showNotification('Wallet disconnected', 'info');

        console.log('Wallet disconnected');
    }

    async executeTransaction() {
        if (!this.validateTransactionFlow() || !this.isWalletConnected) {
            this.showNotification('Invalid transaction setup', 'error');
            return;
        }

        console.log('Executing DeFi transaction...');
        this.executeBtn.classList.add('loading');
        this.executeBtn.textContent = 'Executing...';

        try {
            // Build transaction flow
            const transactionFlow = this.buildTransactionFlow();
            console.log('Transaction Flow:', transactionFlow);

            // Mock InstaDApp DSA integration
            await this.executeWithInstaDAppDSA(transactionFlow);

            this.showNotification('Transaction executed successfully!', 'success');

        } catch (error) {
            console.error('Transaction execution failed:', error);
            this.showNotification('Transaction failed: ' + error.message, 'error');
        } finally {
            this.executeBtn.classList.remove('loading');
            this.updateExecuteButton();
        }
    }

    buildTransactionFlow() {
        const flow = {
            protocols: this.droppedBlocks.filter(block => block.type === 'protocol').map(b => b.name),
            tokens: this.droppedBlocks.filter(block => block.type === 'token').map(b => b.name),
            actions: this.droppedBlocks.filter(block => block.type === 'action').map(b => b.name),
            timestamp: Date.now()
        };

        return flow;
    }

    async executeWithInstaDAppDSA(transactionFlow) {
        console.log('🚀 Mock InstaDApp DSA Integration');

        // Simulate DSA account creation/connection
        await this.delay(1000);
        console.log('✅ Connected to DSA Account: 0xDSA123...');

        // Simulate building spell/transaction
        await this.delay(1500);
        console.log('🔮 Building DSA Spell...');

        const mockSpell = this.buildMockDSASpell(transactionFlow);
        console.log('📜 DSA Spell:', mockSpell);

        // Simulate transaction execution
        await this.delay(2000);
        console.log('⛽ Estimating gas...');
        console.log('💸 Gas estimate: 0.025 ETH');

        await this.delay(1000);
        console.log('📝 Transaction submitted to blockchain...');
        console.log('🔗 Transaction hash: 0x' + this.generateMockTxHash());

        await this.delay(2000);
        console.log('✅ Transaction confirmed!');

        // Update UI with success animation
        this.droppedBlocks.forEach(block => {
            block.element.classList.add('success-animation');
        });
    }

    buildMockDSASpell(flow) {
        const spells = [];

        flow.actions.forEach((action, index) => {
            const protocol = flow.protocols[index % flow.protocols.length];
            const token = flow.tokens[index % flow.tokens.length];

            spells.push({
                connector: protocol.toLowerCase(),
                method: action.toLowerCase(),
                args: [token, '1000000000000000000'] // 1 token (18 decimals)
            });
        });

        return {
            spells,
            origin: 'defi-drag-drop-app',
            gasLimit: '500000'
        };
    }

    generateMockTxHash() {
        return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(0, 255, 127, 0.2)' :
                type === 'error' ? 'rgba(255, 107, 107, 0.2)' :
                    'rgba(100, 255, 218, 0.2)'};
            border: 1px solid ${type === 'success' ? '#00ff7f' :
                type === 'error' ? '#ff6b6b' :
                    '#64ffda'};
            border-radius: 12px;
            padding: 15px 20px;
            color: ${type === 'success' ? '#00ff7f' :
                type === 'error' ? '#ff6b6b' :
                    '#64ffda'};
            z-index: 1000;
            backdrop-filter: blur(10px);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Advanced features for future development
    saveWorkflow() {
        const workflow = {
            blocks: this.droppedBlocks.map(block => ({
                type: block.type,
                name: block.name
            })),
            timestamp: Date.now()
        };

        localStorage.setItem('defi-workflow', JSON.stringify(workflow));
        this.showNotification('Workflow saved!', 'success');
    }

    loadWorkflow() {
        const savedWorkflow = localStorage.getItem('defi-workflow');
        if (savedWorkflow) {
            const workflow = JSON.parse(savedWorkflow);

            // Clear current canvas
            this.clearCanvas();

            // Add saved blocks
            workflow.blocks.forEach((blockData, index) => {
                setTimeout(() => {
                    this.addBlockToCanvas(blockData, 100 + (index * 10), 100 + (index * 10));
                }, index * 200);
            });

            this.showNotification('Workflow loaded!', 'success');
        }
    }

    clearCanvas() {
        this.droppedBlocks.forEach(block => block.element.remove());
        this.droppedBlocks = [];
        this.updateCanvasState();
        this.updateExecuteButton();
    }

    // Analytics and tracking
    trackUserAction(action, data) {
        console.log(`📊 Analytics: ${action}`, data);
        // In production, this would send to analytics service
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the dashboard when DOM is loaded
let defiDashboard;
document.addEventListener('DOMContentLoaded', () => {
    defiDashboard = new DeFiDashboard();
    console.log('🎉 DeFi Drag & Drop Dashboard initialized!');
    console.log('💡 Try dragging protocols, tokens, and actions to the canvas');
    console.log('🔗 Connect your wallet and execute transactions');
});

// Keyboard shortcuts
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
        }
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeFiDashboard;
}
