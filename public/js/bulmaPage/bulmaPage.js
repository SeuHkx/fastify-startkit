function createPagination(containerSelector, initialData, onPageChange) {
    const container = document.querySelector(containerSelector);

    // 初始化数据
    const data = {
        currentPage: initialData.currentPage || 1,
        totalPages: initialData.totalPages,
        pageSize: initialData.pageSize || 10,
        totalItems: initialData.totalItems || 0,
    };

    // 渲染分页
    function renderPagination() {
        container.innerHTML = '';

        // 如果没有数据
        // if (data.totalPages === 0) {
        //     const noDataMessage = document.createElement('p');
        //     noDataMessage.textContent = '暂无数据';
        //     noDataMessage.className = 'no-data-message';
        //     container.appendChild(noDataMessage);
        //     return;
        // }

        // 创建分页导航容器
        const pagination = document.createElement('nav');
        pagination.className = 'pagination is-small';
        pagination.setAttribute('role', 'navigation');
        pagination.setAttribute('aria-label', 'pagination');

        // 创建上一页按钮
        const prevButton = createNavButton('上一页', data.currentPage === 1);
        pagination.appendChild(prevButton);

        // 创建页码列表
        const pageList = document.createElement('ul');
        pageList.className = 'pagination-list';

        for (let i = 1; i <= data.totalPages; i++) {
            if (shouldDisplayPage(i, data.currentPage, data.totalPages)) {
                const pageItem = createPageItem(i, data.currentPage);
                pageList.appendChild(pageItem);
            } else if (i === data.currentPage - 2 || i === data.currentPage + 2) {
                const ellipsis = createEllipsis();
                pageList.appendChild(ellipsis);
            }
        }

        pagination.appendChild(pageList);

        // 创建下一页按钮
        const nextButton = createNavButton('下一页', data.currentPage === data.totalPages);
        pagination.appendChild(nextButton);

        container.appendChild(pagination);

        // 添加事件监听
        addEventListeners();
    }

    // 创建分页按钮（上一页/下一页）
    function createNavButton(label, isDisabled) {
        const button = document.createElement('a');
        button.className = `pagination-${label === '上一页' ? 'previous' : 'next'}`;
        button.textContent = label;

        if (isDisabled) {
            button.classList.add('is-disabled');
        } else {
            button.dataset.page = label === '上一页' ? data.currentPage - 1 : data.currentPage + 1;
        }

        return button;
    }

    // 创建页码项
    function createPageItem(pageNumber, currentPage) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'pagination-link';
        a.textContent = pageNumber;
        a.dataset.page = pageNumber;

        if (pageNumber === currentPage) {
            a.classList.add('is-current');
        }

        li.appendChild(a);
        return li;
    }

    // 创建省略号
    function createEllipsis() {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.className = 'pagination-ellipsis';
        span.textContent = '…';
        li.appendChild(span);
        return li;
    }

    // 判断是否显示页码
    function shouldDisplayPage(pageNumber, currentPage, totalPages) {
        return (
            pageNumber === 1 || // 显示第一页
            pageNumber === totalPages || // 显示最后一页
            Math.abs(pageNumber - currentPage) <= 1 // 显示当前页及其前后页
        );
    }

    // 更新页码
    function updatePage(newPage) {
        if (newPage < 1 || newPage > data.totalPages) {
            return;
        }

        data.currentPage = newPage;
        renderPagination();

        if (typeof onPageChange === 'function') {
            onPageChange(newPage);
        }
    }

    // 更新分页数据
    function updatePagination(newTotalItems) {
        data.totalItems = newTotalItems;
        data.totalPages = Math.ceil(newTotalItems / data.pageSize);

        if (data.currentPage > data.totalPages) {
            data.currentPage = data.totalPages;
        }

        if (data.totalPages === 0) {
            data.currentPage = 1;
        }

        renderPagination();
    }

    // 添加事件监听
    function addEventListeners() {
        const links = container.querySelectorAll('.pagination-link, .pagination-previous, .pagination-next');

        links.forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const page = parseInt(link.dataset.page, 10);
                if (!isNaN(page)) {
                    updatePage(page);
                }
            });
        });
    }
    renderPagination();
    return {
        updatePagination,
        updatePage
    };
}
