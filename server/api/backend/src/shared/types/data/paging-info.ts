export class PagingInfo {
   total_items: number;
   total_pages: number;
   page_size: number;
   current_page: number;

   constructor(skip: number, take: number, total: number) {
      this.total_items = total;
      this.page_size = take;

      this.total_pages = total > 0 && take > 0 ? Math.ceil(total / take) : 0;

      this.current_page = take > 0 ? Math.floor(skip / take) + 1 : 1;
   }
}
