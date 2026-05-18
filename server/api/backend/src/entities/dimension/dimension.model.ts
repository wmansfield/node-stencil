// ===========================================
// Entity
// ===========================================

export class Dimension {
   width: number;
   height: number;
   

   constructor(data: Partial<Dimension>) {
      Object.assign(this, data);
   }

   static sanitize(obj: Dimension): void {
      if (!obj) return;
   }
}