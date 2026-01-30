# Fix bug: createRandomCard không tạo được card khi build

## Triệu chứng

Khi chạy game ở môi trường **development** (ví dụ `npm run dev`) thì `createRandomCard` hoạt động bình thường, tạo được card ngẫu nhiên. Nhưng sau khi **build** (ví dụ `npm run build` với Vite/esbuild), chạy bản build thì không tạo được card (lỗi hoặc không có card xuất hiện).

## Nguyên nhân

### 1. Cách đăng ký card class cũ (dễ gây lỗi khi build)

Trong `CardFactory`, các class card (Coin, SwordSteampunk, AnemoSamachurl, …) được đăng ký vào `cardClasses` bằng phương thức `add()`:

```javascript
this.cardClasses.add = function (this, classes) {
    classes.forEach((cls) => {
        const name = cls.name;  // Lấy tên class từ runtime
        if (name) this[name] = cls;
    });
};
this.cardClasses.add([Coin, SwordSteampunk, ...]);
```

Tức là **key** dùng để lưu trong `cardClasses` chính là **`cls.name`** (tên function/class do JavaScript cung cấp tại runtime), ví dụ: `"Coin"`, `"SwordSteampunk"`, `"AnemoSamachurl"`, …

### 2. Minify làm thay đổi tên function/class

Khi **build production**, Vite/esbuild thường bật **minify** (rút gọn code). Một phần của minify là **mangle** tên biến và tên function/class để giảm dung lượng file.

- Trước build: `Coin.name === "Coin"` → đăng ký `cardClasses["Coin"] = Coin`.
- Sau build (minify): `Coin.name` có thể thành `"e"` hoặc `"n"` (tên bị đổi) → đăng ký thành `cardClasses["e"] = Coin` (hoặc key khác).

Trong khi đó, **tên card** dùng để tra cứu lại đến từ **dữ liệu tĩnh** (không bị minify):

- File `dungeonList.json` vẫn là: `"coins": ["Coin"]`, `"weapons": ["SwordSteampunk", "SwordForest", ...]`, …
- `_calculateCardWeights()` và `createRandomCard()` vẫn dùng đúng chuỗi `"Coin"`, `"SwordSteampunk"`, … để gọi `this.cardClasses[cardType]`.

Kết quả:

- `this.cardClasses["Coin"]` → **undefined** (vì thực tế chỉ có `cardClasses["e"]` hoặc key đã bị mangle).
- `this.cardClasses["SwordSteampunk"]` → **undefined**.
- …

→ Khi gọi `new CardClass(scene, x, y, index)` với `CardClass` là `undefined` sẽ gây lỗi runtime, hoặc logic phía trên bỏ qua và không tạo được card. Đó là lý do **sau build thì không tạo được card**.

## Cách sửa

### Ý tưởng

Không dùng **tên class tại runtime** (`cls.name`) làm key đăng ký nữa, mà dùng **chuỗi cố định** (string literal) khớp với tên trong `dungeonList.json`. String literal trong code **không bị minify**, nên sau build key vẫn là `"Coin"`, `"SwordSteampunk"`, … và tra cứu đúng.

### Thay đổi trong code (CardFactory.ts)

1. **Thêm helper đăng ký bằng chuỗi cố định**

```ts
const register = (key: string, cls: new (...args: any[]) => Card) => {
    (this.cardClasses as any)[key] = cls;
};
```

2. **Đăng ký từng loại card bằng key cố định**

- Coin: `register('Coin', Coin);`
- Weapon: `register('SwordSteampunk', SwordSteampunk);`, `register('SwordForest', SwordForest);`, …
- Enemy: `register('AnemoSamachurl', AnemoSamachurl);`, …
- Food, Trap, Treasure, Bomb, Empty: tương tự, mỗi class một lần `register('TênTrongDungeonList', Class);`

Đảm bảo **key** trùng với tên dùng trong `dungeonList.json` (ví dụ `availableCards.weapons`, `availableCards.enemies`, …).

3. **Giữ lại `cardClasses.add`** (nếu chỗ khác vẫn dùng) nhưng **không phụ thuộc vào nó** cho việc tra cứu theo tên từ `dungeonList`. Phần tra cứu cho `createRandomCard` và `_calculateCardWeights` chỉ dựa trên các lần gọi `register(...)` ở trên.

4. **An toàn trong `createRandomCard`**

- Trước khi `new CardClass(...)`: kiểm tra `if (CardClass)` (phòng trường hợp key sai hoặc thiếu đăng ký).
- Fallback cuối vòng: nếu có `lastCardType` thì mới lấy `LastClass` và chỉ `new LastClass(...)` khi `LastClass` tồn tại, không thì trả về `null` hoặc xử lý an toàn khác.

Sau khi sửa như vậy, dù build có minify thì:

- `cardClasses["Coin"]`, `cardClasses["SwordSteampunk"]`, … vẫn trỏ đúng tới class tương ứng.
- `createRandomCard` và các chỗ dùng `cardClasses[cardType]` sẽ tìm được class và tạo card bình thường.

## Tóm tắt

| Trước fix | Sau fix |
|-----------|--------|
| Key trong `cardClasses` = `cls.name` (runtime) | Key = string cố định, trùng `dungeonList.json` |
| Minify đổi `cls.name` → key sai → không tìm thấy class | String literal không bị minify → key đúng → tìm được class |
| Build → không tạo được card / lỗi | Build → tạo card bình thường |

File sửa chính: `src/modules/CardFactory.ts` (phần constructor, đăng ký `cardClasses`, và phần `createRandomCard`).
