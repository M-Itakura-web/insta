document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded');

    // Configuration
    const morningSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];

    // Full afternoon slots (Weekday)
    // 15:00 - 19:30 (30 min intervals)
    const afternoonSlotsFull = [
        '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00', '18:30',
        '19:00', '19:30'
    ];

    const statusOptions = [
        { value: 'o', label: '〇', class: 'status-o' },
        { value: 'x', label: '×', class: 'status-x' },
        { value: 'triangle', label: '△', class: 'status-triangle' }
    ];

    // Elements
    const themeSelect = document.getElementById('theme-select');
    const dateInput = document.getElementById('date-input');
    const storeNameInput = document.getElementById('store-name-input');
    const commentInput = document.getElementById('comment-input');
    const morningContainer = document.getElementById('morning-slots');
    const afternoonContainer = document.getElementById('afternoon-slots');
    const generateBtn = document.getElementById('generate-btn');

    // Preview Elements
    const storyPreview = document.getElementById('story-preview');
    const previewDate = document.getElementById('preview-date');
    const previewMorningList = document.getElementById('preview-morning-list');
    const previewAfternoonList = document.getElementById('preview-afternoon-list');
    const previewComment = document.getElementById('preview-comment');
    const previewBrandTag = document.querySelector('.brand-tag');

    // Initialize Date
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;

    // Set Initial Theme
    if (themeSelect && storyPreview) {
        storyPreview.setAttribute('data-theme', themeSelect.value);
    }

    // Load Store Name from LocalStorage
    const savedStoreName = localStorage.getItem('storeName');
    if (savedStoreName) {
        if (storeNameInput) storeNameInput.value = savedStoreName;
        if (previewBrandTag) previewBrandTag.textContent = savedStoreName;
    } else {
        if (previewBrandTag) previewBrandTag.textContent = '@YourStoreName';
    }

    // Initial Render
    try {
        updateDatePreview();
        renderAllSlots();
    } catch (e) {
        console.error('Error during initial render:', e);
    }

    // Event Listeners
    if (themeSelect) {
        themeSelect.addEventListener('change', () => {
            if (storyPreview) storyPreview.setAttribute('data-theme', themeSelect.value);
        });
    }

    if (dateInput) {
        dateInput.addEventListener('change', () => {
            updateDatePreview();
            renderAllSlots();
        });
    }

    if (storeNameInput) {
        storeNameInput.addEventListener('input', () => {
            const val = storeNameInput.value || '@YourStoreName';
            if (previewBrandTag) previewBrandTag.textContent = val;
            localStorage.setItem('storeName', val);
        });
    }

    if (commentInput) {
        commentInput.addEventListener('input', updateCommentPreview);
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', generateImage);
    }

    // Functions
    function updateDatePreview() {
        if (!dateInput || !previewDate) return;
        const dateVal = new Date(dateInput.value);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[dateVal.getDay()];
        const formattedDate = `${dateVal.getMonth() + 1}.${dateVal.getDate()} ${dayName}`;
        previewDate.textContent = formattedDate;
    }

    function getAfternoonSlotsForDate(dateString) {
        const dateVal = new Date(dateString);
        const day = dateVal.getDay(); // 0=Sun, 6=Sat

        // If Saturday (6) or Sunday (0), exclude 18:00 onwards
        if (day === 0 || day === 6) {
            return afternoonSlotsFull.filter(time => {
                const hour = parseInt(time.split(':')[0], 10);
                return hour < 18;
            });
        }
        return afternoonSlotsFull;
    }

    function renderAllSlots() {
        // Morning slots are constant
        renderControlSlots(morningSlots, morningContainer, 'morning');
        renderPreviewSlots(morningSlots, previewMorningList, 'morning');

        // Afternoon slots depend on date
        if (dateInput) {
            const currentAfternoonSlots = getAfternoonSlotsForDate(dateInput.value);
            renderControlSlots(currentAfternoonSlots, afternoonContainer, 'afternoon');
            renderPreviewSlots(currentAfternoonSlots, previewAfternoonList, 'afternoon');
        }
    }

    function updateCommentPreview() {
        if (previewComment && commentInput) {
            previewComment.textContent = commentInput.value;
        }
    }

    function renderControlSlots(times, container, prefix) {
        if (!container) return;
        container.innerHTML = '';
        times.forEach((time, index) => {
            const div = document.createElement('div');
            div.className = 'slot-item';

            const label = document.createElement('span');
            label.className = 'slot-time';
            label.textContent = time;

            const select = document.createElement('select');
            select.className = 'slot-select';
            select.id = `${prefix}-select-${index}`;

            statusOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                select.appendChild(option);
            });

            // Default to 'o'
            select.value = 'o';

            select.addEventListener('change', () => {
                updateSlotPreview(prefix, index, select.value);
            });

            div.appendChild(label);
            div.appendChild(select);
            container.appendChild(div);
        });
    }

    function renderPreviewSlots(times, container, prefix) {
        if (!container) return;
        container.innerHTML = '';
        times.forEach((time, index) => {
            const li = document.createElement('li');
            li.className = 'time-item';
            li.id = `${prefix}-preview-${index}`;

            const timeSpan = document.createElement('span');
            timeSpan.className = 'time';
            timeSpan.textContent = time;

            const statusSpan = document.createElement('span');
            statusSpan.className = 'status status-o'; // Default
            statusSpan.textContent = '〇';

            li.appendChild(timeSpan);
            li.appendChild(statusSpan);
            container.appendChild(li);
        });
    }

    function updateSlotPreview(prefix, index, value) {
        const previewItem = document.getElementById(`${prefix}-preview-${index}`);
        if (!previewItem) return;

        const statusSpan = previewItem.querySelector('.status');
        const option = statusOptions.find(opt => opt.value === value);

        statusSpan.textContent = option.label;
        statusSpan.className = `status ${option.class}`;
    }

    async function generateImage() {
        const originalCanvas = document.getElementById('story-preview');

        // Show loading state
        generateBtn.textContent = '生成中...';
        generateBtn.disabled = true;

        try {
            // Clone the element to avoid transform/scaling issues during capture
            const clone = originalCanvas.cloneNode(true);

            // Reset styles for the clone to ensure it renders correctly at full scale
            clone.style.transform = 'none';
            clone.style.position = 'fixed';
            clone.style.top = '0';
            clone.style.left = '0';
            clone.style.zIndex = '-1000';
            clone.style.width = '1080px';
            clone.style.height = '1920px';

            // Append to body so it can be rendered
            document.body.appendChild(clone);

            // Wait a moment for fonts and layout to settle
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(clone, {
                scale: 1,
                useCORS: true,
                backgroundColor: null,
                logging: false,
                onclone: (clonedDoc) => {
                    // Ensure fonts are loaded in the clone context if needed
                    // Usually appending to body is enough
                }
            });

            // Remove the clone
            document.body.removeChild(clone);

            const link = document.createElement('a');
            link.download = `reservation_${dateInput.value}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Image generation failed:', err);
            alert('画像の生成に失敗しました。');
        } finally {
            generateBtn.textContent = '画像を保存';
            generateBtn.disabled = false;
        }
    }
});
