interface Store {
  currentPage: number;
  feeds: NewsFeed[];
}

interface News {
  readonly id: number;
  readonly title: string;
  readonly user: string;
  readonly time_ago: string;
  readonly url: string;
  readonly content: string;
}

interface NewsFeed extends News{
  readonly comments_count: number;
  readonly points: number;
  read?: boolean;
}

interface NewsDetail extends News{
  readonly comments: NewsComment[];
}

interface NewsComment extends News{ 
  readonly level: number;
  readonly comments: NewsComment[];
}

const ajax: XMLHttpRequest = new XMLHttpRequest();
const content = document.createElement('div');
const NEWS_URL = 'https://api.hnpwa.com/v0/news/1.json';
const CONTENT_URL = 'https://api.hnpwa.com/v0/item/@id.json';
const container: HTMLElement | null = document.getElementById('root');
const store: Store = {
    currentPage: 1,
    feeds: [],
}

class Api{
  url: string;
  ajax: XMLHttpRequest;

  constructor(url: string) {
    this.url = url;
    this.ajax = new XMLHttpRequest();
  }

  protected getRequest<AjaxResponse>(): AjaxResponse{
    this.ajax.open('GET', this.url, false);
    this.ajax.send();

    return JSON.parse(this.ajax.response);
  }
}

class NewsFeedApi extends Api{
  getData(): NewsFeed[] {
    return this.getRequest<NewsFeed[]>();
  }
}

class NewsDetailApi extends Api{
  getData(): NewsDetail {
    return this.getRequest<NewsDetail>();
  }
}


function makeFeeds(feeds: NewsFeed[]): NewsFeed[]{
    for(let i=0; i<feeds.length; i++){
        feeds[i].read = false;
    }

    return feeds;
}

//타입 가드
function updateView(html:string): void{
  if(container != null){
    container.innerHTML = html;
  }else{
    console.error("최상위 컨텐이너가 없어 UI를 진행하지 못합니다.");
  }

}

function newsFeed(): void{
    const api = new NewsFeedApi(NEWS_URL);
    const newsList = [];
    let newsFeed: NewsFeed[] = store.feeds;
    const maxPage = newsFeed.length/10;
    let template = `
    <div class="bg-gray-600 min-h-screen">
      <div class="bg-white text-xl">
        <div class="mx-auto px-4">
          <div class="flex justify-between items-center py-6">
            <div class="flex justify-start">
              <h1 class="font-extrabold">Hacker News</h1>
            </div>
            <div class="items-center justify-end">
              <a href="#/page/{{__prev_page__}}" class="text-gray-500">
                Previous
              </a>
              <a href="#/page/{{__next_page__}}" class="text-gray-500 ml-4">
                Next
              </a>
            </div>
          </div> 
        </div>
      </div>
      <div class="p-4 text-2xl text-gray-700">
        {{__news_feed__}}        
      </div>
    </div>
    `;

    // 처음 실행시 데이터 불러오기
    if(newsFeed.length === 0){
        newsFeed = store.feeds = makeFeeds(api.getData());
    }
    

    for(let i= (store.currentPage-1) * 10; i < store.currentPage * 10; i++){
        newsList.push(`
        <div class="p-6 ${newsFeed[i].read === true ? 'bg-yellow-500' : 'bg-white'} mt-6 rounded-lg shadow-md transition-colors duration-500 hover:bg-green-100">
        <div class="flex">
          <div class="flex-auto">
            <a href="#/show/${newsFeed[i].id}">${newsFeed[i].title}</a>  
          </div>
          <div class="text-center text-sm">
            <div class="w-10 text-white bg-green-300 rounded-lg px-0 py-2">${newsFeed[i].comments_count}</div>
          </div>
        </div>
        <div class="flex mt-3">
          <div class="grid grid-cols-3 text-sm text-gray-500">
            <div><i class="fas fa-user mr-1"></i>${newsFeed[i].user}</div>
            <div><i class="fas fa-heart mr-1"></i>${newsFeed[i].points}</div>
            <div><i class="far fa-clock mr-1"></i>${newsFeed[i].time_ago}</div>
          </div>  
        </div>
      </div>
        `);
    }

    template = template.replace('{{__news_feed__}}', newsList.join(''));
    template = template.replace('{{__prev_page__}}', String(store.currentPage > 1 ? store.currentPage - 1 : 1));
    template = template.replace('{{__next_page__}}', String(store.currentPage < Math.ceil(maxPage) ? store.currentPage + 1 : Math.ceil(maxPage)));

    updateView(template);
}

function newsDetail(): void{
    const id = location.hash.substr(7); //location은 객체가 연결된 URL을 표현
    const api = new NewsDetailApi(CONTENT_URL.replace('@id', id));
    const newsContent = api.getData();
    let template = `
    <h1>${newsContent.title}</h1>
    
    <div>
    <a href="#/page/${store.currentPage}">목록으로</a>

    {{__comments__}}
    </div>
    `;

    for(let i=0; i< store.feeds.length; i++){
        if(store.feeds[i].id === Number(id)){
            store.feeds[i].read = true;
            break;
        }
    }

    updateView(template.replace('{{__comments__}}', makeComment(newsContent.comments)));
        
}

function makeComment(comments: NewsComment[]): string{
        const commentString = [];

        for(let i=0; i<comments.length; i++){
          const comment: NewsComment = comments[i];
            commentString.push(`
            <div style="padding-left: ${comment.level * 40}px;" class="mt-4">
              <div class="text-gray-400">
                <i class="fa fa-sort-up mr-2"></i>
                <strong>${comment.user}</strong> ${comment.time_ago}
              </div>
              <p class="text-gray-700">${comment.content}</p>
            </div>   
            `);

            if(comment.comments.length >0 ){
                commentString.push(makeComment(comment.comments));
            }
        }

        return commentString.join('');
    }

function router():void{
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