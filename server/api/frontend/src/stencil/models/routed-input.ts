export interface RoutedInput<TInput> extends RoutedNoInput {
   input: TInput;
}
export interface RoutedNoInput {
   jurisdiction_id: string;
   nonce?: number | string;
   ui_tag?: boolean;
}

export interface RoutedId {
   jurisdiction_id: string;
}
