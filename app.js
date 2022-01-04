const ajax = new XMLHttpRequest();
const content = document.createElement('div');
const NEWS_URL = 'https://api.hnpwa.com/v0/news/1.json';
const CONTENT_URL = 'https://api.hnpwa.com/v0/item/@id.json';
const container = document.getElementById('root');
const store = {
    currentPage: 1,
}


function getData(url){
    ajax.open('GET', url, false);
    ajax.send();

    return JSON.parse(ajax.response);
}

function newsFeed(){
    const newsList = [];
    const newsFeed = getData(NEWS_URL);
    const maxPage = newsFeed.length/10;
    
    newsList.push('<ul>');

    for(let i= (store.currentPage-1) * 10; i < store.currentPage * 10; i++){
        newsList.push(`
        <li>
        <a href="#/show/${newsFeed[i].id}">${newsFeed[i].title} (${newsFeed[i].comments_count})</a>
        </li>
        `);
    }
    newsList.push('</ul>');
    newsList.push(`
    <div>
     <a href="#/page/${store.currentPage > 1 ? store.currentPage - 1 : 1}">이전 페이지</a>
     <a href="#/page/${store.currentPage < Math.ceil(maxPage) ? store.currentPage + 1 : Math.ceil(maxPage)}">다음 페이지</a>
    </div>
    `);

    container.innerHTML = newsList.join('');
}

function newsDetail(){
    const id = location.hash.substr(7); //location은 객체가 연결된 URL을 표현
    const newsContent = getData(CONTENT_URL.replace('@id', id));


    container.innerHTML = `
    <h1>${newsContent.title}</h1>
    
    <div>
    <a href="#/page/${store.currentPage}">목록으로</a>
    </div>
    `;
}

function router(){
    const routePath = location.hash;

    if(routePath === ''){
        newsFeed();
    } else if(routePath.indexOf('page') >= 0){
        store.currentPage = Number(routePath.substr(7));
        newsFeed();
    } else{
        newsDetail();
    }

}


window.addEventListener('hashchange', router);

router();

