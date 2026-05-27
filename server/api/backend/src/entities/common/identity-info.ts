export class IdentityInfo {
   primary_key: string;
   route_id?: string;

   constructor(primary_key: string, route_id?: string) {
      this.primary_key = primary_key;
      this.route_id = route_id;
   }
}
