# Extending Generated Code

Generated base files (`.base.ts`) should never be edited directly. This document explains where and how to add custom logic.

## The Base/Extension Pattern

For each entity with a collection, the generator creates:

| File | Token | Purpose |
|------|-------|---------|
| `{entity}.manager.base.ts` | STARTFILE | Generated CRUD operations |
| `{entity}.manager.ts` | ENSUREFILE | Your custom logic |
| `{entity}.controller.base.ts` | STARTFILE | Generated REST endpoints |
| `{entity}.controller.ts` | ENSUREFILE | Your custom endpoints |

**STARTFILE** = Regenerated every time
**ENSUREFILE** = Created once, never overwritten

## Backend Customization

### Manager Extension (`{entity}.manager.ts`)

Override base methods or add new ones:

```typescript
@Injectable()
export class AccountManager extends AccountManagerBase {
  
  // Override validation
  protected override async validate(item: Account): Promise<void> {
    await super.validate(item);
    // Add custom validation
    if (!item.email.includes('@')) {
      throw new BadRequestException('Invalid email');
    }
  }
  
  // Override sanitization
  protected override async sanitize(item: Account): Promise<void> {
    await super.sanitize(item);
    item.email = item.email.toLowerCase().trim();
  }
  
  // Add custom methods
  async findByEmail(email: string): Promise<Account | null> {
    return this.findOne({ email: email.toLowerCase() });
  }
  
  // Override perspective update
  async updateInfoPerspective(id: string, data: Partial<Account>): Promise<Account> {
    // Custom logic before update
    const result = await super.updateInfoPerspective(id, data);
    // Custom logic after update
    return result;
  }
}
```

### Controller Extension (`{entity}.controller.ts`)

Add custom endpoints:

```typescript
@Controller('admin/:jurisdiction_id/account')
export class AccountController extends AccountControllerBase {
  
  @Get('by-email/:email')
  @Permission(Permissions.AccountRead)
  async getByEmail(
    @Param('jurisdiction_id') jurisdictionId: string,
    @Param('email') email: string,
  ): Promise<ItemResult<Account>> {
    const account = await this.manager.findByEmail(email);
    return { item: account };
  }
  
  @Post('bulk-update')
  @Permission(Permissions.AccountWrite)
  async bulkUpdate(
    @Param('jurisdiction_id') jurisdictionId: string,
    @Body() request: BulkUpdateRequest,
  ): Promise<ActionResult> {
    // Custom bulk operation
    return { success: true };
  }
}
```

### Available Base Methods

The generated manager base provides:

```typescript
// CRUD operations
getById(id: string): Promise<Entity>
find(filter: ListInput): Promise<Entity[]>
insert(item: Entity): Promise<Entity>
replace(id: string, item: Entity): Promise<Entity>
delete(id: string): Promise<void>

// Perspective updates (if entity has perspectives)
update{Perspective}Perspective(id: string, data: Partial<Entity>): Promise<Entity>

// Hooks to override
validate(item: Entity): Promise<void>
sanitize(item: Entity): Promise<void>
calculateSearchable(item: Entity): string
beforeInsert(item: Entity): Promise<void>
afterInsert(item: Entity): Promise<void>
beforeReplace(id: string, item: Entity): Promise<void>
afterReplace(id: string, item: Entity): Promise<void>
beforeDelete(id: string): Promise<void>
afterDelete(id: string): Promise<void>
```

## Frontend Customization

### CRUD List View (`{Entity}List.tsx`)

The generated list uses DataTable. Customize columns, filters, or actions:

```tsx
// Already generated with ENSUREFILE - safe to edit
export const AccountList = () => {
  // Add custom columns
  const columns: ColumnDef<IAccount>[] = [
    // ... generated columns
    {
      header: 'Custom Action',
      cell: ({ row }) => (
        <Button onClick={() => handleCustomAction(row.original)}>
          Action
        </Button>
      ),
    },
  ];
  
  // Add custom filters or toolbar items
  return (
    <DataTable
      columns={columns}
      // ... other props
      toolbarExtra={<CustomToolbarButton />}
    />
  );
};
```

### CRUD Editor View (`{Entity}Editor.tsx`)

Customize form fields or add validation:

```tsx
export const AccountEditor = ({ is_create, record, onClose }) => {
  const form = useForm<IAccount>({
    resolver: zodResolver(accountSchema),
    defaultValues: record,
  });
  
  // Add custom field handling
  const handleEmailChange = (value: string) => {
    form.setValue('email', value.toLowerCase());
  };
  
  return (
    <Form {...form}>
      {/* Generated fields plus custom ones */}
      <FormItem label="Custom Field">
        <CustomInput {...form.register('customField')} />
      </FormItem>
    </Form>
  );
};
```

### Adding Custom Components

For pickers and other components, the pattern is similar - ENSUREFILE creates them once, then they're yours to customize.

## What NOT to Edit

**Never edit these files** - they will be overwritten:

- `*.model.ts` (in backend and frontend)
- `*.schema.ts`
- `*.manager.base.ts`
- `*.controller.base.ts`
- `*Api.ts` (in frontend stencil/endpoints/)
- `list-input-*.ts` (request types)

## Safe to Edit

These files use ENSUREFILE and are safe to customize:

- `*.manager.ts` (extension)
- `*.controller.ts` (extension)
- `*.module.ts`
- `*List.tsx`
- `*Editor.tsx`
- `*Detail.tsx`
- `*Picker.tsx` / `*PickerMulti.tsx`
