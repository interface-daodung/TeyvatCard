// CalculatePositionCard.js
// Tính toán vị trí và di chuyển thẻ trong game - Pure utility functions

export default class CalculatePositionCard {
    // Bảng tra cứu cho movement targets - tối ưu hóa hiệu suất
    static MOVEMENT_TABLE = {
        0: { // Ô góc trên trái
            '3': { first: 1, second: 2 },   // Xuống đến 1
            '1': { first: 3, second: 6 }    // Phải đến 3
        },
        2: { // Ô góc trên phải
            '5': { first: 1, second: 0 },   // Xuống đến 1
            '1': { first: 5, second: 8 }    // Trái đến 5
        },
        6: { // Ô góc dưới trái
            '3': { first: 7, second: 8 },  // Lên đến 7
            '7': { first: 3, second: 0 }  // Phải đến 3
        },
        8: { // Ô góc dưới phải
            '5': { first: 7, second: 6 },    // Lên đến 7
            '7': { first: 5, second: 2 }   // Trái đến 5
        },
        4: { // Ô giữa
            '1': { first: 7, second: null },   // Xuống đến 1
            '3': { first: 5, second: null },   // Phải đến 3
            '5': { first: 3, second: null },   // Trái đến 5
            '7': { first: 1, second: null }    // Lên đến 7
        },
        5: { // Ô phải giữa
            '2': { first: 8, second: null },   // Xuống đến 2
            '8': { first: 2, second: null },   // Lên đến 8
            '4': { first: 2, second: null }    // Trái đến 4
        },
        3: { // Ô trái giữa
            '0': { first: 6, second: null },   // Xuống đến 0
            '4': { first: 6, second: null },    // Phải đến 4
            '6': { first: 0, second: null }   // Lên đến 6

        },
        1: { // Ô trên giữa
            '0': { first: 2, second: null },   // Xuống đến 0
            '2': { first: 0, second: null },   // Phải đến 2
            '4': { first: 0, second: null }    // Lên đến 4
        },
        7: { // Ô dưới giữa
            '6': { first: 8, second: null },   // Lên đến 6
            '4': { first: 8, second: null },  // Trái đến 4
            '8': { first: 6, second: null }  // Phải đến 8
        }
    };

    /**
     * Kiểm tra xem có thể di chuyển từ vị trí này đến vị trí kia không
     * @param {number} fromIndex - Vị trí bắt đầu
     * @param {number} toIndex - Vị trí đích
     * @returns {boolean} True nếu có thể di chuyển
     */
    static isValidMove(fromIndex, toIndex) {
        // ===== KIỂM TRA VỊ TRÍ HỢP LỆ =====
        if (fromIndex === toIndex) return false; // Không thể di chuyển đến chính mình

        const fromPos = { row: Math.floor(fromIndex / 3), col: fromIndex % 3 };
        const toPos = { row: Math.floor(toIndex / 3), col: toIndex % 3 };

        // ===== KIỂM TRA KHOẢNG CÁCH =====
        const rowDiff = Math.abs(fromPos.row - toPos.row);
        const colDiff = Math.abs(fromPos.col - toPos.col);

        // Chỉ cho phép di chuyển 1 ô theo chiều ngang hoặc dọc
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            return true;
        }

        return false;
    }

    /**
     * Tính toán movement targets dựa trên bảng tra cứu tối ưu
     * @param {number} from - Vị trí bắt đầu
     * @param {number} to - Vị trí đích
     * @returns {Object} Thông tin movement với character và follow targets
     */
    static calculateMovement(from, to) {
        // Chỉ dùng 'to' làm key vì 'from' đã được lọc trước đó
        const { first: firstTarget, second: secondTarget } = this.MOVEMENT_TABLE[from][to] || { first: null, second: null };

        const movement = [];
        movement.push({ from: from, to: to });
        movement.push({ from: firstTarget, to: from });

        // Thêm secondTarget nếu có
        if (secondTarget !== null) {
            movement.push({ from: secondTarget, to: firstTarget });
        }

        return movement;
    }

    /**
     * Tính toán các vị trí liền kề theo hình dấu cộng (trên, dưới, trái, phải)
     * @param {number} index - Vị trí trong lưới 3x3 (0-8)
     * @returns {Array} Mảng các vị trí liền kề hợp lệ
     */
    static getAdjacentPositions(index) {
        if (index < 0 || index > 8) {
            console.warn(`CalculatePositionCard: Invalid index ${index}`);
            return [];
        }

        const adjacent = [];
        const row = Math.floor(index / 3);
        const col = index % 3;

        // Vị trí trên (nếu có)
        if (row > 0) {
            adjacent.push(index - 3);
        }

        // Vị trí dưới (nếu có)
        if (row < 2) {
            adjacent.push(index + 3);
        }

        // Vị trí trái (nếu có)
        if (col > 0) {
            adjacent.push(index - 1);
        }

        // Vị trí phải (nếu có)
        if (col < 2) {
            adjacent.push(index + 1);
        }

        return adjacent;
    }

    /**
     * Trộn mảng theo thuật toán Fisher-Yates shuffle
     * @param {Array} array - Mảng cần trộn
     * @returns {Array} Mảng đã được trộn
     */
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
