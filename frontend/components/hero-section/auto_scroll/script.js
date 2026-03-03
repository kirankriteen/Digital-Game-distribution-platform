const heroData = [
    {
        title: "Cloud Gaming",
        desc: "Stream the latest titles at 4K 120FPS on any device.",
        img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200",
        color: "linear-gradient(135deg, #6366f1, #a855f7)"
    },
    {
        title: "Developer Hub",
        desc: "Build and scale your games with our robust API and SDKs.",
        img: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200",
        color: "linear-gradient(135deg, #10b981, #3b82f6)"
    }
];

class HeroSlider {
    constructor(data) {
        this.data = data;
        this.index = 0;
        this.container = document.getElementById('hero-text');
        this.tabsContainer = document.getElementById('hero-tabs-container');
        this.init();
    }

    init() {
        // Create Tabs dynamically
        this.data.forEach((item, i) => {
            const btn = document.createElement('button');
            btn.className = `hero-tab ${i === 0 ? 'active' : ''}`;
            btn.innerText = item.title;
            btn.onclick = () => this.goTo(i);
            this.tabsContainer.appendChild(btn);
        });
        this.updateDisplay();
        this.startAutoPlay();
    }

    goTo(i) {
        if (this.index === i) return;
        this.index = i;
        this.updateDisplay();
        this.resetTimer();
    }

    updateDisplay() {
        const item = this.data[this.index];
        this.container.classList.add('fade-out');

        // Sync Tabs
        document.querySelectorAll('.hero-tab').forEach((t, i) => {
            t.classList.toggle('active', i === this.index);
        });

        setTimeout(() => {
            document.getElementById('hero-title').innerText = item.title;
            document.getElementById('hero-desc').innerText = item.desc;
            document.getElementById('hero-img').style.backgroundImage = `url(${item.img})`;
            document.documentElement.style.setProperty('--hero-gradient', item.color);
            this.container.classList.remove('fade-out');
        }, 400);
    }

    startAutoPlay() {
        this.timer = setInterval(() => {
            this.index = (this.index + 1) % this.data.length;
            this.updateDisplay();
        }, 5000);
    }

    resetTimer() {
        clearInterval(this.timer);
        this.startAutoPlay();
    }
}

// Fire it up
new HeroSlider(heroData);   