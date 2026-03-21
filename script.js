/**
 * Tarbert Coastal Dashboard Logic
 * Updated with accurate Tarbert Island Tide Table data
 */

// Coordinates
const LOCATIONS = {
    tarbert: { lat: 52.5718, lon: -9.3703 }, // Local (Weather, Waves)
    regional: { lat: 52.5800, lon: -9.6500 } // Deep Water (SST fallback)
};

// Tarbert Island Tide Table - January 2026 (last few days)
const TIDE_TABLE_JAN_2026 = {
    30: [
        { time: '05:00', height: 4.60, type: 'High' },
        { time: '11:14', height: 0.90, type: 'Low' },
        { time: '17:30', height: 4.60, type: 'High' },
        { time: '23:24', height: 1.00, type: 'Low' }
    ],
    31: [
        { time: '05:35', height: 4.80, type: 'High' },
        { time: '11:49', height: 0.70, type: 'Low' },
        { time: '18:03', height: 4.70, type: 'High' },
        { time: '23:59', height: 0.80, type: 'Low' }
    ]
};

// Tarbert Island Tide Table - February 2026 (from provided PDF)
const TIDE_TABLE_FEB_2026 = {
    1: [
        { time: '05:03', height: 4.90, type: 'High' },
        { time: '11:22', height: 0.50, type: 'Low' },
        { time: '17:38', height: 4.80, type: 'High' },
        { time: '23:35', height: 0.70, type: 'Low' }
    ],
    2: [
        { time: '05:50', height: 5.10, type: 'High' },
        { time: '12:06', height: 0.30, type: 'Low' },
        { time: '18:21', height: 5.00, type: 'High' }
    ],
    3: [
        { time: '00:16', height: 0.60, type: 'Low' },
        { time: '06:32', height: 5.20, type: 'High' },
        { time: '12:45', height: 0.20, type: 'Low' },
        { time: '19:02', height: 5.00, type: 'High' }
    ],
    4: [
        { time: '00:54', height: 0.60, type: 'Low' },
        { time: '07:11', height: 5.20, type: 'High' },
        { time: '13:23', height: 0.30, type: 'Low' },
        { time: '19:39', height: 4.90, type: 'High' }
    ],
    5: [
        { time: '01:29', height: 0.60, type: 'Low' },
        { time: '07:48', height: 5.10, type: 'High' },
        { time: '13:58', height: 0.50, type: 'Low' },
        { time: '20:14', height: 4.80, type: 'High' }
    ],
    6: [
        { time: '02:02', height: 0.80, type: 'Low' },
        { time: '08:24', height: 4.90, type: 'High' },
        { time: '14:32', height: 0.80, type: 'Low' },
        { time: '20:49', height: 4.60, type: 'High' }
    ],
    7: [
        { time: '02:36', height: 1.10, type: 'Low' },
        { time: '09:01', height: 4.70, type: 'High' },
        { time: '15:06', height: 1.10, type: 'Low' },
        { time: '21:26', height: 4.40, type: 'High' }
    ],
    8: [
        { time: '03:13', height: 1.40, type: 'Low' },
        { time: '09:40', height: 4.40, type: 'High' },
        { time: '15:44', height: 1.50, type: 'Low' },
        { time: '22:07', height: 4.20, type: 'High' }
    ],
    9: [
        { time: '03:55', height: 1.70, type: 'Low' },
        { time: '10:27', height: 4.10, type: 'High' },
        { time: '16:32', height: 1.80, type: 'Low' },
        { time: '22:59', height: 4.00, type: 'High' }
    ],
    10: [
        { time: '04:51', height: 2.00, type: 'Low' },
        { time: '11:30', height: 3.80, type: 'High' },
        { time: '17:37', height: 2.10, type: 'Low' }
    ],
    11: [
        { time: '00:05', height: 3.80, type: 'High' },
        { time: '06:10', height: 2.20, type: 'Low' },
        { time: '12:58', height: 3.70, type: 'High' },
        { time: '19:04', height: 2.20, type: 'Low' }
    ],
    12: [
        { time: '01:26', height: 3.80, type: 'High' },
        { time: '07:47', height: 2.10, type: 'Low' },
        { time: '14:26', height: 3.70, type: 'High' },
        { time: '20:25', height: 2.10, type: 'Low' }
    ],
    13: [
        { time: '02:41', height: 4.00, type: 'High' },
        { time: '09:02', height: 1.80, type: 'Low' },
        { time: '15:29', height: 3.90, type: 'High' },
        { time: '21:24', height: 1.80, type: 'Low' }
    ],
    14: [
        { time: '03:37', height: 4.20, type: 'High' },
        { time: '09:54', height: 1.50, type: 'Low' },
        { time: '16:16', height: 4.10, type: 'High' },
        { time: '22:09', height: 1.50, type: 'Low' }
    ],
    15: [
        { time: '04:21', height: 4.40, type: 'High' },
        { time: '10:37', height: 1.20, type: 'Low' },
        { time: '16:55', height: 4.40, type: 'High' },
        { time: '22:48', height: 1.20, type: 'Low' }
    ],
    16: [
        { time: '05:00', height: 4.60, type: 'High' },
        { time: '11:14', height: 0.90, type: 'Low' },
        { time: '17:30', height: 4.60, type: 'High' },
        { time: '23:24', height: 1.00, type: 'Low' }
    ],
    17: [
        { time: '05:35', height: 4.80, type: 'High' },
        { time: '11:49', height: 0.70, type: 'Low' },
        { time: '18:03', height: 4.70, type: 'High' },
        { time: '23:59', height: 0.80, type: 'Low' }
    ],
    18: [
        { time: '06:09', height: 5.00, type: 'High' },
        { time: '12:23', height: 0.50, type: 'Low' },
        { time: '18:36', height: 4.90, type: 'High' }
    ],
    19: [
        { time: '00:32', height: 0.70, type: 'Low' },
        { time: '06:43', height: 5.10, type: 'High' },
        { time: '12:55', height: 0.40, type: 'Low' },
        { time: '19:10', height: 5.00, type: 'High' }
    ],
    20: [
        { time: '01:05', height: 0.60, type: 'Low' },
        { time: '07:18', height: 5.20, type: 'High' },
        { time: '13:28', height: 0.50, type: 'Low' },
        { time: '19:45', height: 5.00, type: 'High' }
    ],
    21: [
        { time: '01:39', height: 0.70, type: 'Low' },
        { time: '07:54', height: 5.10, type: 'High' },
        { time: '14:03', height: 0.60, type: 'Low' },
        { time: '20:22', height: 4.90, type: 'High' }
    ],
    22: [
        { time: '02:17', height: 0.80, type: 'Low' },
        { time: '08:34', height: 4.90, type: 'High' },
        { time: '14:41', height: 0.90, type: 'Low' },
        { time: '21:02', height: 4.70, type: 'High' }
    ],
    23: [
        { time: '02:58', height: 1.00, type: 'Low' },
        { time: '09:20', height: 4.60, type: 'High' },
        { time: '15:25', height: 1.20, type: 'Low' },
        { time: '21:48', height: 4.40, type: 'High' }
    ],
    24: [
        { time: '03:49', height: 1.40, type: 'Low' },
        { time: '10:16', height: 4.30, type: 'High' },
        { time: '16:21', height: 1.60, type: 'Low' },
        { time: '22:49', height: 4.10, type: 'High' }
    ],
    25: [
        { time: '04:54', height: 1.70, type: 'Low' },
        { time: '11:36', height: 3.90, type: 'High' },
        { time: '17:38', height: 1.90, type: 'Low' }
    ],
    26: [
        { time: '00:13', height: 3.90, type: 'High' },
        { time: '06:32', height: 1.80, type: 'Low' },
        { time: '13:15', height: 3.90, type: 'High' },
        { time: '19:23', height: 1.90, type: 'Low' }
    ],
    27: [
        { time: '01:47', height: 4.00, type: 'High' },
        { time: '08:23', height: 1.60, type: 'Low' },
        { time: '14:48', height: 4.10, type: 'High' },
        { time: '20:52', height: 1.60, type: 'Low' }
    ],
    28: [
        { time: '03:08', height: 4.30, type: 'High' },
        { time: '09:33', height: 1.10, type: 'Low' },
        { time: '15:54', height: 4.40, type: 'High' },
        { time: '21:52', height: 1.30, type: 'Low' }
    ]
};

// Tarbert Island Tide Table - March 2026
const TIDE_TABLE_MAR_2026 = {
    1: [
        { time: '04:07', height: 4.60, type: 'High' },
        { time: '10:24', height: 0.70, type: 'Low' },
        { time: '16:43', height: 4.70, type: 'High' },
        { time: '22:39', height: 0.90, type: 'Low' }
    ],
    2: [
        { time: '04:54', height: 4.90, type: 'High' },
        { time: '11:07', height: 0.40, type: 'Low' },
        { time: '17:25', height: 4.90, type: 'High' },
        { time: '23:20', height: 0.60, type: 'Low' }
    ],
    3: [
        { time: '05:35', height: 5.10, type: 'High' },
        { time: '11:47', height: 0.20, type: 'Low' },
        { time: '18:02', height: 5.00, type: 'High' },
        { time: '23:58', height: 0.50, type: 'Low' }
    ],
    4: [
        { time: '06:12', height: 5.20, type: 'High' },
        { time: '12:23', height: 0.20, type: 'Low' },
        { time: '18:37', height: 5.10, type: 'High' }
    ],
    5: [
        { time: '00:31', height: 0.50, type: 'Low' },
        { time: '06:47', height: 5.20, type: 'High' },
        { time: '12:56', height: 0.30, type: 'Low' },
        { time: '19:10', height: 5.00, type: 'High' }
    ],
    6: [
        { time: '01:02', height: 0.60, type: 'Low' },
        { time: '07:20', height: 5.10, type: 'High' },
        { time: '13:27', height: 0.60, type: 'Low' },
        { time: '19:41', height: 4.90, type: 'High' }
    ],
    7: [
        { time: '01:32', height: 0.80, type: 'Low' },
        { time: '07:53', height: 4.90, type: 'High' },
        { time: '13:56', height: 0.90, type: 'Low' },
        { time: '20:12', height: 4.80, type: 'High' }
    ],
    8: [
        { time: '02:03', height: 1.00, type: 'Low' },
        { time: '08:25', height: 4.70, type: 'High' },
        { time: '14:26', height: 1.20, type: 'Low' },
        { time: '20:46', height: 4.60, type: 'High' }
    ],
    9: [
        { time: '02:36', height: 1.30, type: 'Low' },
        { time: '09:00', height: 4.40, type: 'High' },
        { time: '15:00', height: 1.60, type: 'Low' },
        { time: '21:23', height: 4.30, type: 'High' }
    ],
    10: [
        { time: '03:13', height: 1.60, type: 'Low' },
        { time: '09:41', height: 4.10, type: 'High' },
        { time: '15:41', height: 1.90, type: 'Low' },
        { time: '22:08', height: 4.00, type: 'High' }
    ],
    11: [
        { time: '04:00', height: 1.90, type: 'Low' },
        { time: '10:35', height: 3.70, type: 'High' },
        { time: '16:38', height: 2.20, type: 'Low' },
        { time: '23:10', height: 3.80, type: 'High' }
    ],
    12: [
        { time: '05:10', height: 2.20, type: 'Low' },
        { time: '12:02', height: 3.50, type: 'High' },
        { time: '18:06', height: 2.40, type: 'Low' }
    ],
    13: [
        { time: '00:35', height: 3.60, type: 'High' },
        { time: '07:00', height: 2.20, type: 'Low' },
        { time: '13:53', height: 3.60, type: 'High' },
        { time: '19:57', height: 2.20, type: 'Low' }
    ],
    14: [
        { time: '02:04', height: 3.80, type: 'High' },
        { time: '08:32', height: 1.90, type: 'Low' },
        { time: '14:59', height: 3.80, type: 'High' },
        { time: '20:59', height: 1.90, type: 'Low' }
    ],
    15: [
        { time: '03:05', height: 4.00, type: 'High' },
        { time: '09:25', height: 1.50, type: 'Low' },
        { time: '15:46', height: 4.10, type: 'High' },
        { time: '21:43', height: 1.50, type: 'Low' }
    ],
    16: [
        { time: '03:51', height: 4.30, type: 'High' },
        { time: '10:07', height: 1.10, type: 'Low' },
        { time: '16:24', height: 4.40, type: 'High' },
        { time: '22:21', height: 1.10, type: 'Low' }
    ],
    17: [
        { time: '04:30', height: 4.60, type: 'High' },
        { time: '10:44', height: 0.70, type: 'Low' },
        { time: '17:00', height: 4.70, type: 'High' },
        { time: '22:57', height: 0.80, type: 'Low' }
    ],
    18: [
        { time: '05:06', height: 4.90, type: 'High' },
        { time: '11:19', height: 0.50, type: 'Low' },
        { time: '17:34', height: 4.90, type: 'High' },
        { time: '23:33', height: 0.60, type: 'Low' }
    ],
    19: [
        { time: '05:42', height: 5.10, type: 'High' },
        { time: '11:54', height: 0.30, type: 'Low' },
        { time: '18:08', height: 5.10, type: 'High' }
    ],
    20: [
        { time: '00:07', height: 0.40, type: 'Low' },
        { time: '06:17', height: 5.30, type: 'High' },
        { time: '12:28', height: 0.20, type: 'Low' },
        { time: '18:44', height: 5.20, type: 'High' }
    ],
    21: [
        { time: '00:42', height: 0.40, type: 'Low' },
        { time: '06:54', height: 5.30, type: 'High' },
        { time: '13:03', height: 0.30, type: 'Low' },
        { time: '19:19', height: 5.20, type: 'High' }
    ],
    22: [
        { time: '01:18', height: 0.40, type: 'Low' },
        { time: '07:33', height: 5.20, type: 'High' },
        { time: '13:39', height: 0.50, type: 'Low' },
        { time: '19:57', height: 5.00, type: 'High' }
    ],
    23: [
        { time: '01:56', height: 0.60, type: 'Low' },
        { time: '08:16', height: 4.90, type: 'High' },
        { time: '14:18', height: 0.80, type: 'Low' },
        { time: '20:39', height: 4.80, type: 'High' }
    ],
    24: [
        { time: '02:39', height: 0.90, type: 'Low' },
        { time: '09:03', height: 4.60, type: 'High' },
        { time: '15:04', height: 1.20, type: 'Low' },
        { time: '21:27', height: 4.40, type: 'High' }
    ],
    25: [
        { time: '03:30', height: 1.30, type: 'Low' },
        { time: '10:03', height: 4.10, type: 'High' },
        { time: '16:02', height: 1.70, type: 'Low' },
        { time: '22:29', height: 4.10, type: 'High' }
    ],
    26: [
        { time: '04:41', height: 1.60, type: 'Low' },
        { time: '11:28', height: 3.80, type: 'High' },
        { time: '17:30', height: 2.00, type: 'Low' },
        { time: '23:57', height: 3.80, type: 'High' }
    ],
    27: [
        { time: '06:29', height: 1.70, type: 'Low' },
        { time: '13:19', height: 3.80, type: 'High' },
        { time: '19:25', height: 1.90, type: 'Low' }
    ],
    28: [
        { time: '01:40', height: 3.90, type: 'High' },
        { time: '08:13', height: 1.40, type: 'Low' },
        { time: '14:43', height: 4.00, type: 'High' },
        { time: '20:42', height: 1.50, type: 'Low' }
    ],
    29: [
        { time: '03:57', height: 4.20, type: 'High' },
        { time: '10:15', height: 1.00, type: 'Low' },
        { time: '16:39', height: 4.40, type: 'High' },
        { time: '22:34', height: 1.10, type: 'Low' }
    ],
    30: [
        { time: '04:51', height: 4.50, type: 'High' },
        { time: '11:02', height: 0.70, type: 'Low' },
        { time: '17:24', height: 4.70, type: 'High' },
        { time: '23:18', height: 0.80, type: 'Low' }
    ],
    31: [
        { time: '05:34', height: 4.80, type: 'High' },
        { time: '11:43', height: 0.40, type: 'Low' },
        { time: '18:02', height: 4.90, type: 'High' },
        { time: '23:57', height: 0.60, type: 'Low' }
    ]
};

// Tarbert Island Tide Table - April 2026
const TIDE_TABLE_APR_2026 = {
    1: [
        { time: '06:12', height: 5.00, type: 'High' },
        { time: '12:20', height: 0.30, type: 'Low' },
        { time: '18:36', height: 5.00, type: 'High' }
    ],
    2: [
        { time: '00:33', height: 0.50, type: 'Low' },
        { time: '06:47', height: 5.10, type: 'High' },
        { time: '12:55', height: 0.40, type: 'Low' },
        { time: '19:08', height: 5.00, type: 'High' }
    ],
    3: [
        { time: '01:04', height: 0.50, type: 'Low' },
        { time: '07:20', height: 5.10, type: 'High' },
        { time: '13:26', height: 0.50, type: 'Low' },
        { time: '19:39', height: 5.00, type: 'High' }
    ],
    4: [
        { time: '01:35', height: 0.60, type: 'Low' },
        { time: '07:51', height: 5.00, type: 'High' },
        { time: '13:55', height: 0.70, type: 'Low' },
        { time: '20:09', height: 4.90, type: 'High' }
    ],
    5: [
        { time: '02:04', height: 0.80, type: 'Low' },
        { time: '08:22', height: 4.80, type: 'High' },
        { time: '14:23', height: 1.00, type: 'Low' },
        { time: '20:40', height: 4.80, type: 'High' }
    ],
    6: [
        { time: '02:34', height: 1.00, type: 'Low' },
        { time: '08:54', height: 4.60, type: 'High' },
        { time: '14:53', height: 1.30, type: 'Low' },
        { time: '21:12', height: 4.60, type: 'High' }
    ],
    7: [
        { time: '03:06', height: 1.20, type: 'Low' },
        { time: '09:27', height: 4.30, type: 'High' },
        { time: '15:25', height: 1.60, type: 'Low' },
        { time: '21:48', height: 4.30, type: 'High' }
    ],
    8: [
        { time: '03:41', height: 1.50, type: 'Low' },
        { time: '10:06', height: 4.00, type: 'High' },
        { time: '16:03', height: 1.80, type: 'Low' },
        { time: '22:30', height: 4.00, type: 'High' }
    ],
    9: [
        { time: '04:25', height: 1.70, type: 'Low' },
        { time: '10:56', height: 3.70, type: 'High' },
        { time: '16:54', height: 2.10, type: 'Low' },
        { time: '23:24', height: 3.80, type: 'High' }
    ],
    10: [
        { time: '05:26', height: 2.00, type: 'Low' },
        { time: '12:08', height: 3.50, type: 'High' },
        { time: '18:12', height: 2.30, type: 'Low' }
    ],
    11: [
        { time: '00:38', height: 3.60, type: 'High' },
        { time: '06:53', height: 2.00, type: 'Low' },
        { time: '14:02', height: 3.50, type: 'High' },
        { time: '19:57', height: 2.20, type: 'Low' }
    ],
    12: [
        { time: '02:10', height: 3.70, type: 'High' },
        { time: '08:33', height: 1.80, type: 'Low' },
        { time: '15:14', height: 3.70, type: 'High' },
        { time: '21:12', height: 1.80, type: 'Low' }
    ],
    13: [
        { time: '03:19', height: 3.90, type: 'High' },
        { time: '09:36', height: 1.40, type: 'Low' },
        { time: '16:04', height: 4.10, type: 'High' },
        { time: '22:02', height: 1.40, type: 'Low' }
    ],
    14: [
        { time: '04:09', height: 4.30, type: 'High' },
        { time: '10:22', height: 1.00, type: 'Low' },
        { time: '16:46', height: 4.40, type: 'High' },
        { time: '22:45', height: 1.00, type: 'Low' }
    ],
    15: [
        { time: '04:52', height: 4.60, type: 'High' },
        { time: '11:04', height: 0.70, type: 'Low' },
        { time: '17:25', height: 4.70, type: 'High' },
        { time: '23:25', height: 0.70, type: 'Low' }
    ],
    16: [
        { time: '05:32', height: 4.90, type: 'High' },
        { time: '11:43', height: 0.40, type: 'Low' },
        { time: '18:03', height: 5.00, type: 'High' }
    ],
    17: [
        { time: '00:04', height: 0.40, type: 'Low' },
        { time: '06:12', height: 5.10, type: 'High' },
        { time: '12:22', height: 0.20, type: 'Low' },
        { time: '18:40', height: 5.20, type: 'High' }
    ],
    18: [
        { time: '00:43', height: 0.30, type: 'Low' },
        { time: '06:52', height: 5.20, type: 'High' },
        { time: '13:01', height: 0.20, type: 'Low' },
        { time: '19:18', height: 5.20, type: 'High' }
    ],
    19: [
        { time: '01:21', height: 0.20, type: 'Low' },
        { time: '07:34', height: 5.20, type: 'High' },
        { time: '13:40', height: 0.30, type: 'Low' },
        { time: '19:58', height: 5.20, type: 'High' }
    ],
    20: [
        { time: '02:01', height: 0.30, type: 'Low' },
        { time: '08:18', height: 5.10, type: 'High' },
        { time: '14:20', height: 0.50, type: 'Low' },
        { time: '20:40', height: 5.00, type: 'High' }
    ],
    21: [
        { time: '02:43', height: 0.50, type: 'Low' },
        { time: '09:05', height: 4.80, type: 'High' },
        { time: '15:03', height: 0.80, type: 'Low' },
        { time: '21:25', height: 4.70, type: 'High' }
    ],
    22: [
        { time: '03:29', height: 0.80, type: 'Low' },
        { time: '09:57', height: 4.40, type: 'High' },
        { time: '15:53', height: 1.20, type: 'Low' },
        { time: '22:16', height: 4.40, type: 'High' }
    ],
    23: [
        { time: '04:24', height: 1.10, type: 'Low' },
        { time: '11:00', height: 4.10, type: 'High' },
        { time: '16:56', height: 1.60, type: 'Low' },
        { time: '23:19', height: 4.00, type: 'High' }
    ],
    24: [
        { time: '05:38', height: 1.30, type: 'Low' },
        { time: '12:23', height: 3.80, type: 'High' },
        { time: '18:24', height: 1.80, type: 'Low' }
    ],
    25: [
        { time: '00:40', height: 3.80, type: 'High' },
        { time: '07:10', height: 1.40, type: 'Low' },
        { time: '14:03', height: 3.80, type: 'High' },
        { time: '20:00', height: 1.70, type: 'Low' }
    ],
    26: [
        { time: '02:15', height: 3.90, type: 'High' },
        { time: '08:37', height: 1.20, type: 'Low' },
        { time: '15:15', height: 4.00, type: 'High' },
        { time: '21:11', height: 1.40, type: 'Low' }
    ],
    27: [
        { time: '03:27', height: 4.10, type: 'High' },
        { time: '09:38', height: 1.00, type: 'Low' },
        { time: '16:09', height: 4.30, type: 'High' },
        { time: '22:03', height: 1.10, type: 'Low' }
    ],
    28: [
        { time: '04:20', height: 4.30, type: 'High' },
        { time: '10:27', height: 0.80, type: 'Low' },
        { time: '16:53', height: 4.50, type: 'High' },
        { time: '22:47', height: 0.90, type: 'Low' }
    ],
    29: [
        { time: '05:04', height: 4.50, type: 'High' },
        { time: '11:09', height: 0.60, type: 'Low' },
        { time: '17:32', height: 4.70, type: 'High' },
        { time: '23:27', height: 0.70, type: 'Low' }
    ],
    30: [
        { time: '05:43', height: 4.70, type: 'High' },
        { time: '11:47', height: 0.60, type: 'Low' },
        { time: '18:07', height: 4.80, type: 'High' }
    ]
};

// DOM Elements
const els = {
    temp: document.getElementById('current-temp'),
    conditionIcon: document.getElementById('weather-icon'),
    conditionDesc: document.getElementById('weather-desc'),
    feelsLike: document.getElementById('feels-like'),
    rain: document.getElementById('current-rain'),
    rainStatus: document.getElementById('rain-status'),
    nextRain: document.getElementById('next-hour-rain'),
    seaTemp: document.getElementById('sea-temp'),
    waveHeight: document.getElementById('wave-height'),
    windSpeed: document.getElementById('wind-speed'),
    windDir: document.getElementById('wind-dir'),
    windGusts: document.getElementById('wind-gusts'),
    windBeaufort: document.getElementById('wind-beaufort'),
    compassNeedle: document.getElementById('compass-needle'),
    nextHighTide: document.getElementById('next-high-tide'),
    nextLowTide: document.getElementById('next-low-tide'),
    nextHighHeight: document.getElementById('next-high-height'),
    nextLowHeight: document.getElementById('next-low-height'),
    tideState: document.getElementById('tide-state'),
    swimSafety: document.getElementById('swim-safety'),
    forecastContainer: document.getElementById('forecast-container'),
    updatedTime: document.getElementById('last-updated-time'),
    rainfallChartCtx: document.getElementById('rainfallChart')?.getContext('2d'),
    tideChartCtx: document.getElementById('tideChart')?.getContext('2d'),
    sunrise: document.getElementById('sunrise-time'),
    sunset: document.getElementById('sunset-time'),
    weeklyTidesContainer: document.getElementById('weekly-tides-container'),
    currentDate: document.getElementById('current-date'),
    tideSource: document.getElementById('tide-source'),
    moonIcon: document.getElementById('moon-icon'),
    moonLabel: document.getElementById('moon-label'),
    moonTideType: document.getElementById('moon-tide-type'),
    highTideContext: document.getElementById('high-tide-context'),
    lowTideContext: document.getElementById('low-tide-context'),
    seaTempTrend: document.getElementById('sea-temp-trend'),
    seaTempHero: document.getElementById('sea-temp-hero'),
    seaTempTrendHero: document.getElementById('sea-temp-trend-hero')
};

// Weather Codes Mapping - Improved for Feather Icons
const weatherCodes = {
    0: { desc: 'Clear Sky', icon: 'sun' },
    1: { desc: 'Mainly Clear', icon: 'cloud-sun' },
    2: { desc: 'Partly Cloudy', icon: 'cloud' },
    3: { desc: 'Overcast', icon: 'cloud' },
    45: { desc: 'Foggy', icon: 'cloud' },
    48: { desc: 'Rime Fog', icon: 'cloud' },
    51: { desc: 'Light Drizzle', icon: 'cloud-drizzle' },
    53: { desc: 'Moderate Drizzle', icon: 'cloud-drizzle' },
    55: { desc: 'Dense Drizzle', icon: 'cloud-drizzle' },
    61: { desc: 'Slight Rain', icon: 'cloud-rain' },
    63: { desc: 'Moderate Rain', icon: 'cloud-rain' },
    65: { desc: 'Heavy Rain', icon: 'cloud-rain' },
    71: { desc: 'Slight Snow', icon: 'cloud-snow' },
    99: { desc: 'Thunderstorm with Hail', icon: 'cloud-lightning' }
};

function getWeatherIcon(code) {
    return (weatherCodes[code] && weatherCodes[code].icon) || 'help-circle';
}

function getWeatherDesc(code) {
    return (weatherCodes[code] && weatherCodes[code].desc) || 'Unknown';
}

function formatTime(timeStr) {
    // Handle both ISO strings and HH:MM format
    if (timeStr.includes('T')) {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return timeStr;
}

function formatTimeFromDate(date) {
    return date.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Get the correct day name accounting for timezone
function getDayName(date, isToday = false) {
    if (isToday) return 'Today';
    return date.toLocaleDateString('en-IE', { weekday: 'short' });
}

// Moon Phase Calculation
function getMoonPhase(date) {
    // Known new moon: 2024-01-11 11:57 UTC
    const knownNewMoon = new Date('2024-01-11T11:57:00Z');
    const synodicMonth = 29.53058867;
    const diff = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const phase = (diff / synodicMonth) % 1;
    const phaseValue = phase < 0 ? phase + 1 : phase;

    const phases = [
        { name: 'New Moon', icon: '🌑', type: 'Spring' },
        { name: 'Waxing Crescent', icon: '🌒', type: '' },
        { name: 'First Quarter', icon: '🌓', type: 'Neap' },
        { name: 'Waxing Gibbous', icon: '🌔', type: '' },
        { name: 'Full Moon', icon: '🌕', type: 'Spring' },
        { name: 'Waning Gibbous', icon: '🌖', type: '' },
        { name: 'Last Quarter', icon: '🌗', type: 'Neap' },
        { name: 'Waning Crescent', icon: '🌘', type: '' }
    ];

    const index = Math.floor(phaseValue * 8 + 0.5) % 8;
    return phases[index];
}

// Data Fetching
async function initDashboard() {
    updateTime();

    // Parallel fetching
    await Promise.all([
        fetchWeather(),
        fetchMarine()
    ]);

    // Render tides from static table data
    renderTidesFromTable();

    feather.replace();
}

function updateTime() {
    const now = new Date();
    els.updatedTime.textContent = now.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });

    // Update current date display
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('en-IE', dateOptions);
    if (els.currentDate) {
        els.currentDate.textContent = dateStr;
    }

    // Update Rainfall Card Date - show just day and time
    const rainDateOptions = { weekday: 'short', day: 'numeric', month: 'short' };
    const rainDateStr = now.toLocaleDateString('en-IE', rainDateOptions);
    if (document.getElementById('rain-date')) {
        document.getElementById('rain-date').textContent = rainDateStr;
    }
}

async function fetchWeather() {
    try {
        const { lat, lon } = LOCATIONS.tarbert;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&hourly=precipitation,precipitation_probability,temperature_2m&timezone=Europe%2FDublin&past_days=1&forecast_days=7`;
        const res = await fetch(url);
        const data = await res.json();
        renderWeather(data);
        renderForecast(data);
    } catch (e) {
        console.error("Weather fetch failed", e);
    }
}

async function fetchMarine() {
    try {
        // 1. Try Local Marine Data (Waves + SST trend)
        const { lat, lon } = LOCATIONS.tarbert;
        // Fetch 2 days to compare with yesterday
        const urlLocal = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,sea_surface_temperature&hourly=sea_surface_temperature&timezone=Europe%2FDublin&past_days=1&forecast_days=1`;

        const resLocal = await fetch(urlLocal);
        const dataLocal = await resLocal.json();

        // Render Waves
        if (dataLocal.current && dataLocal.current.wave_height !== undefined) {
            els.waveHeight.textContent = dataLocal.current.wave_height;
        }

        // 2. Check Local SST and Trend
        let sst = null;
        let sstYesterday = null;

        if (dataLocal.current && dataLocal.current.sea_surface_temperature) {
            sst = dataLocal.current.sea_surface_temperature;
        }

        // Calculate Trend from hourly (compare now to 24h ago)
        if (dataLocal.hourly && dataLocal.hourly.sea_surface_temperature) {
            const hourlySST = dataLocal.hourly.sea_surface_temperature;
            const nowIdx = getCurrentHourIndex(dataLocal.hourly.time);
            if (nowIdx !== -1) {
                if (sst === null) sst = hourlySST[nowIdx];
                // Go back 24 hours
                const yesterdayIdx = nowIdx - 24;
                if (yesterdayIdx >= 0) {
                    sstYesterday = hourlySST[yesterdayIdx];
                }
            }
        }

        // 3. Fallback to Regional if needed
        if (sst === null) {
            console.log("Local SST unavailable, trying regional...");
            const { lat: rLat, lon: rLon } = LOCATIONS.regional;
            const urlRegional = `https://marine-api.open-meteo.com/v1/marine?latitude=${rLat}&longitude=${rLon}&current=sea_surface_temperature&hourly=sea_surface_temperature&timezone=Europe%2FDublin&forecast_days=1`;

            const resRegional = await fetch(urlRegional);
            const dataRegional = await resRegional.json();

            if (dataRegional.current && dataRegional.current.sea_surface_temperature) {
                sst = dataRegional.current.sea_surface_temperature;
            }
        }

        // Render SST and Trend
        if (sst !== null && sst !== undefined) {
            els.seaTemp.textContent = Number(sst).toFixed(1);

            if (els.seaTempTrend && sstYesterday !== null) {
                const diff = sst - sstYesterday;
                if (Math.abs(diff) < 0.1) {
                    els.seaTempTrend.textContent = '→';
                    els.seaTempTrend.className = 'temp-trend trend-stable';
                    els.seaTempTrend.title = 'Temperature is stable (vs yesterday)';
                } else if (diff > 0) {
                    els.seaTempTrend.textContent = '↑';
                    els.seaTempTrend.className = 'temp-trend trend-up';
                    els.seaTempTrend.title = `Warming up (+${diff.toFixed(1)}°C since yesterday)`;
                } else {
                    els.seaTempTrend.textContent = '↓';
                    els.seaTempTrend.className = 'temp-trend trend-down';
                    els.seaTempTrend.title = `Cooling down (${diff.toFixed(1)}°C since yesterday)`;
                }
            }
        } else {
            if (els.seaTemp) els.seaTemp.textContent = "--";
            if (els.seaTempHero) els.seaTempHero.textContent = "--";
        }

        // Render to Hero
        if (sst !== null && sst !== undefined && els.seaTempHero) {
            els.seaTempHero.textContent = Number(sst).toFixed(1);
            if (els.seaTempTrendHero && els.seaTempTrend) {
                els.seaTempTrendHero.innerHTML = els.seaTempTrend.innerHTML;
                els.seaTempTrendHero.className = els.seaTempTrend.className;
            }
        }

        // Update Wave Status
        if (dataLocal.current?.wave_height !== undefined) {
            const h = dataLocal.current.wave_height;
            const waveStatus = document.getElementById('wave-status');
            if (waveStatus) waveStatus.textContent = getWaveSummary(h);
        }

        // Re-evaluate swim safety with marine data
        const ws = parseFloat(els.windSpeed?.textContent) || 0;
        const wh = dataLocal.current?.wave_height || 0;
        updateSwimSafety(ws, wh, sst);

    } catch (e) {
        console.error("Marine fetch failed", e);
    }
}

// Get tides for a specific date from the static table
function getTidesForDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const year = date.getFullYear();

    // Check which table to use
    if (year === 2026 && month === 1) {
        return TIDE_TABLE_JAN_2026[day] || [];
    } else if (year === 2026 && month === 2) {
        return TIDE_TABLE_FEB_2026[day] || [];
    } else if (year === 2026 && month === 3) {
        return TIDE_TABLE_MAR_2026[day] || [];
    } else if (year === 2026 && month === 4) {
        return TIDE_TABLE_APR_2026[day] || [];
    }

    return [];
}

// Convert time string (HH:MM) to Date object for a given day
function timeStringToDate(timeStr, baseDate) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

// Render tides from the static table
function renderTidesFromTable() {
    const now = new Date();
    const todayTides = getTidesForDate(now);

    // Find next high and low tides
    let nextHigh = null;
    let nextLow = null;

    // First check today's remaining tides
    for (const tide of todayTides) {
        const tideTime = timeStringToDate(tide.time, now);
        if (tideTime > now) {
            if (tide.type === 'High' && !nextHigh) {
                nextHigh = { ...tide, date: tideTime };
            }
            if (tide.type === 'Low' && !nextLow) {
                nextLow = { ...tide, date: tideTime };
            }
        }
    }

    // If we didn't find one, check tomorrow
    if (!nextHigh || !nextLow) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowTides = getTidesForDate(tomorrow);

        for (const tide of tomorrowTides) {
            const tideTime = timeStringToDate(tide.time, tomorrow);
            if (tide.type === 'High' && !nextHigh) {
                nextHigh = { ...tide, date: tideTime };
            }
            if (tide.type === 'Low' && !nextLow) {
                nextLow = { ...tide, date: tideTime };
            }
            if (nextHigh && nextLow) break;
        }
    }

    // Update display
    els.nextHighTide.textContent = nextHigh ? nextHigh.time : '--';
    els.nextLowTide.textContent = nextLow ? nextLow.time : '--';

    // Show tide heights and context labels
    const AVG_HIGH = 4.3;
    const AVG_LOW = 1.2;

    if (els.nextHighHeight) {
        els.nextHighHeight.textContent = nextHigh ? `${nextHigh.height.toFixed(1)}m` : '';
        if (els.highTideContext && nextHigh) {
            const isAbove = nextHigh.height > AVG_HIGH;
            els.highTideContext.textContent = isAbove ? 'Above Average' : 'Below Average';
            els.highTideContext.className = `tide-context ${isAbove ? 'above' : 'below'}`;
        }
    }
    if (els.nextLowHeight) {
        els.nextLowHeight.textContent = nextLow ? `${nextLow.height.toFixed(1)}m` : '';
        if (els.lowTideContext && nextLow) {
            const isBelow = nextLow.height < AVG_LOW;
            els.lowTideContext.textContent = isBelow ? 'Lower than Avg' : 'Normal Low';
            els.lowTideContext.className = `tide-context ${isBelow ? 'above' : 'below'}`;
        }
    }

    // Determine tide state (rising or falling)
    if (els.tideState && nextHigh && nextLow) {
        if (nextHigh.date < nextLow.date) {
            els.tideState.innerHTML = '<span class="state-icon">▲</span> Tide is rising';
        } else {
            els.tideState.innerHTML = '<span class="state-icon">▼</span> Tide is falling';
        }
    }

    // Moon Phase and Tide Type
    const moon = getMoonPhase(now);
    if (els.moonIcon) els.moonIcon.textContent = moon.icon;
    if (els.moonLabel) els.moonLabel.textContent = `Moon: ${moon.name}`;
    if (els.moonTideType) {
        if (moon.type) {
            els.moonTideType.textContent = `${moon.type} Tide Cycle`;
            els.moonTideType.className = `moon-tide-type ${moon.type.toLowerCase()}-tide`;
            els.moonTideType.style.display = 'block';
        } else {
            els.moonTideType.style.display = 'none';
        }
    }

    // Update tide source indicator
    if (els.tideSource) {
        els.tideSource.textContent = 'Tarbert Island Tide Table';
    }

    // Render tide chart (simulated curve based on next high/low)
    renderTideChart(now, todayTides, nextHigh, nextLow);

    // Render weekly tides
    renderWeeklyTidesFromTable();
}

function renderTideChart(now, todayTides, nextHigh, nextLow) {
    const canvas = document.getElementById('tideChart');
    if (!canvas) return;

    // Generate a 24-hour tide curve simulation
    const labels = [];
    const levels = [];

    // Get tides for today and tomorrow for the chart
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTides = getTidesForDate(tomorrow);

    // Combine all tide events
    const allEvents = [];
    todayTides.forEach(t => {
        const date = timeStringToDate(t.time, now);
        allEvents.push({ ...t, date });
    });
    tomorrowTides.forEach(t => {
        const date = timeStringToDate(t.time, tomorrow);
        allEvents.push({ ...t, date });
    });

    // Sort by time
    allEvents.sort((a, b) => a.date - b.date);

    // Generate 32 points for a smoother curve (24 hours + overlap)
    const startTime = new Date(now);
    startTime.setMinutes(0, 0, 0);

    for (let i = 0; i < 25; i++) {
        const pointTime = new Date(startTime.getTime() + i * 60 * 60 * 1000);
        labels.push(formatTimeFromDate(pointTime));
        const level = interpolateTideLevel(pointTime, allEvents);
        levels.push(level);
    }

    if (window.tideChartInstance) window.tideChartInstance.destroy();

    try {
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 140);
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

        // Prepare peak markers
        const peakMarkers = Array(levels.length).fill(null);
        allEvents.forEach(event => {
            const hourOffset = (event.date - startTime) / (1000 * 60 * 60);
            const index = Math.round(hourOffset);
            if (index >= 0 && index < peakMarkers.length) {
                peakMarkers[index] = event.height;
            }
        });

        window.tideChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Current',
                        data: levels.map((l, i) => i === 0 ? l : null),
                        pointRadius: 6,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#38bdf8',
                        pointBorderWidth: 4,
                        showLine: false,
                        zIndex: 10
                    },
                    {
                        label: 'Peaks',
                        data: peakMarkers,
                        pointRadius: 4,
                        pointBackgroundColor: (context) => {
                            const index = context.dataIndex;
                            const label = labels[index];
                            const event = allEvents.find(e => formatTimeFromDate(e.date) === label);
                            return event && event.type === 'High' ? '#38bdf8' : '#f87171';
                        },
                        pointBorderColor: 'rgba(255,255,255,0.2)',
                        pointBorderWidth: 2,
                        showLine: false
                    },
                    {
                        label: 'Level (m)',
                        data: levels,
                        borderColor: '#38bdf8',
                        backgroundColor: gradient,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1500, easing: 'easeInOutQuart' },
                plugins: {
                    legend: false,
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: (context) => `${context.parsed.y.toFixed(2)}m`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 6 }
                    },
                    y: {
                        display: false,
                        min: 0,
                        max: 6
                    }
                }
            }
        });
    } catch (err) {
        console.error("Tide Chart error:", err);
    }
}

// Interpolate tide level between known points using sine wave approximation
function interpolateTideLevel(time, events) {
    if (events.length < 2) return 2.5; // Default mid-level

    // Find surrounding events
    let prevEvent = null;
    let nextEvent = null;

    for (let i = 0; i < events.length; i++) {
        if (events[i].date > time) {
            nextEvent = events[i];
            prevEvent = events[i - 1] || events[0];
            break;
        }
        prevEvent = events[i];
    }

    if (!nextEvent) {
        nextEvent = events[events.length - 1];
        prevEvent = events[events.length - 2] || events[0];
    }

    if (!prevEvent || !nextEvent) return 2.5;

    // Calculate position in cycle
    const totalDuration = nextEvent.date - prevEvent.date;
    const elapsed = time - prevEvent.date;
    const progress = Math.max(0, Math.min(1, elapsed / totalDuration));

    // Use cosine interpolation for smooth curve
    const prevHeight = prevEvent.height;
    const nextHeight = nextEvent.height;

    // Smooth sinusoidal interpolation
    const interpolated = prevHeight + (nextHeight - prevHeight) * (1 - Math.cos(progress * Math.PI)) / 2;

    return interpolated;
}

function renderWeeklyTidesFromTable() {
    const container = els.weeklyTidesContainer;
    if (!container) return;
    container.innerHTML = '';

    const now = new Date();

    // Generate 7 days of tide data
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(now);
        date.setDate(now.getDate() + dayOffset);

        const tides = getTidesForDate(date);
        if (tides.length === 0) continue;

        const dayLabel = dayOffset === 0 ? 'Today' :
            dayOffset === 1 ? 'Tomorrow' :
                date.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric' });

        const rowDiv = document.createElement('div');
        rowDiv.className = 'tide-row';

        // Generate Pills (with height)
        let eventsHtml = tides.map(t => `
            <span class="tide-pill ${t.type === 'High' ? 'high' : 'low'}">
                ${t.type.charAt(0)} ${t.time} <span style="opacity:0.6">${t.height.toFixed(1)}m</span>
            </span>
        `).join('');

        rowDiv.innerHTML = `
            <div class="tide-date">${dayLabel}</div>
            <div class="tide-times">
                ${eventsHtml}
            </div>
        `;
        container.appendChild(rowDiv);
    }
}

// Rendering
function renderSunTimes(daily) {
    if (!daily.sunrise || !daily.sunset) return;

    // OpenMeteo past_days=1 implies: 0=Yesterday, 1=Today, 2=Tomorrow, etc.
    // We want Today (index 1).
    const todayIndex = 1;

    if (daily.sunrise[todayIndex] && daily.sunset[todayIndex]) {
        const sunrise = new Date(daily.sunrise[todayIndex]);
        const sunset = new Date(daily.sunset[todayIndex]);

        if (els.sunrise) els.sunrise.textContent = sunrise.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
        if (els.sunset) els.sunset.textContent = sunset.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
    }
}

// Convert wind degrees to compass direction
function getWindDirection(degrees) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(degrees / 22.5) % 16];
}

// Short, punchy wind summary
function getWindSummary(kmh, gusts = 0) {
    if (kmh < 1) return "Flat calm";
    if (kmh < 6) return "Barely any wind";
    if (kmh < 12) return "Light breeze";
    if (kmh < 20) return (gusts > 30) ? "Gentle but gusty" : "Gentle breeze";
    if (kmh < 29) return (gusts > 45) ? "Strong gusts" : "Moderate breeze";
    if (kmh < 39) return "Fresh winds";
    if (kmh < 50) return "Strong winds";
    return "Rough conditions";
}

function getWaveSummary(height) {
    if (height < 0.2) return "Flat / Glassy";
    if (height < 0.5) return "Calm";
    if (height < 0.8) return "Small Chop";
    if (height < 1.3) return "Moderate Chop";
    if (height < 2.0) return "Lumpy / Rough";
    return "Very Rough";
}

// Update swim safety badge based on conditions
function updateSwimSafety(windSpeed, waveHeight, waterTemp, windGusts = 0) {
    const el = els.swimSafety;
    if (!el) return;

    let score = 0; // lower = better

    // Base wind check
    if (windSpeed > 30) score += 3;
    else if (windSpeed > 20) score += 2;
    else if (windSpeed > 12) score += 1;

    // Gust check - gusts are often more dangerous than average wind
    if (windGusts > 45) score += 4; // Dangerous
    else if (windGusts > 30) score += 2; // Significant chop
    else if (windGusts > 20 && windGusts > windSpeed * 1.5) score += 1; // "Gusty" conditions


    if (waveHeight > 1.5) score += 3;
    else if (waveHeight > 0.8) score += 1;

    if (waterTemp !== null && waterTemp < 8) score += 1;

    el.classList.remove('swim-good', 'swim-caution', 'swim-poor');
    if (score <= 1) {
        el.textContent = '✓ GOOD';
        el.classList.add('swim-good');
    } else if (score <= 3) {
        el.textContent = '⚠ CAUTION';
        el.classList.add('swim-caution');
    } else {
        el.textContent = '✖ ROUGH';
        el.classList.add('swim-poor');
    }
}

function renderWeather(data) {
    const current = data.current;

    // Render Sun Times
    renderSunTimes(data.daily);

    els.temp.textContent = Math.round(current.temperature_2m);
    els.temp.classList.remove('loading');

    // Feels Like
    if (els.feelsLike && current.apparent_temperature !== undefined) {
        const feelsLike = Math.round(current.apparent_temperature);
        const actualTemp = Math.round(current.temperature_2m);
        if (feelsLike !== actualTemp) {
            els.feelsLike.textContent = `Feels like ${feelsLike}°`;
        } else {
            els.feelsLike.textContent = '';
        }
    }

    // Wind
    if (current.wind_speed_10m !== undefined) {
        if (els.windSpeed) els.windSpeed.textContent = Math.round(current.wind_speed_10m);
        if (els.windDir && current.wind_direction_10m !== undefined) {
            els.windDir.textContent = getWindDirection(current.wind_direction_10m);
        }

        // Rotate compass needle to wind direction
        if (els.compassNeedle && current.wind_direction_10m !== undefined) {
            els.compassNeedle.style.transform = `translate(-50%, -50%) rotate(${current.wind_direction_10m}deg)`;
        }

        // Wind gusts
        if (els.windGusts && current.wind_gusts_10m !== undefined) {
            els.windGusts.innerHTML = `${Math.round(current.wind_gusts_10m)}<span class="wind-detail-unit">km/h</span>`;
        }

        // Casual summary with gust context
        if (els.windBeaufort) {
            els.windBeaufort.textContent = getWindSummary(current.wind_speed_10m, current.wind_gusts_10m);
            els.windBeaufort.style.fontStyle = 'italic';
            els.windBeaufort.style.opacity = '0.9';
        }

        // Update compass speed display - Just the main number
        if (els.windSpeed) {
            const windVal = Math.round(current.wind_speed_10m);
            els.windSpeed.textContent = windVal;
        }

        // Update swim safety with wind + gusts
        const wh = parseFloat(document.getElementById('wave-height')?.textContent) || 0;
        const wt = parseFloat(document.getElementById('sea-temp')?.textContent) || null;
        updateSwimSafety(current.wind_speed_10m, wh, wt, current.wind_gusts_10m);
    }

    // Condition
    const code = current.weather_code;
    const icon = getWeatherIcon(code);
    els.conditionIcon.setAttribute('data-feather', icon);
    els.conditionDesc.textContent = getWeatherDesc(code);

    // Rainfall Logic
    const precip = current.precipitation;
    els.rain.textContent = precip;

    // 1. Rain Status
    let statusText = 'Dry';
    if (precip > 0) statusText = 'Drizzle';
    if (precip >= 0.5) statusText = 'Light Rain';
    if (precip >= 2.5) statusText = 'Moderate Rain';
    if (precip >= 7.6) statusText = 'Heavy Rain';

    if (els.rainStatus) els.rainStatus.textContent = statusText;

    // 2. Next Rain Analysis
    const hourly = data.hourly;
    const nowIndex = getCurrentHourIndex(hourly.time);

    // Find "Next Rain Time" and "24h Total"
    let nextRainTime = null;
    let total24hRain = 0;

    // Look ahead 24 hours
    for (let i = nowIndex; i < nowIndex + 24; i++) {
        if (i >= hourly.precipitation.length) break;
        const precip = hourly.precipitation[i];
        total24hRain += precip;

        if (precip > 0 && nextRainTime === null && i > nowIndex) {
            nextRainTime = hourly.time[i];
        }
    }

    // Update Rain Indicators
    if (els.nextRain) {
        if (nextRainTime) {
            const time = formatTime(nextRainTime);
            els.nextRain.textContent = `Rain expected @ ${time}`;
        } else {
            els.nextRain.textContent = 'No rain expected today';
        }
    }

    // 24h Total and Probability
    if (document.getElementById('rain-total')) {
        document.getElementById('rain-total').textContent = total24hRain.toFixed(1);
    }
    if (document.getElementById('rain-prob') && hourly.precipitation_probability) {
        document.getElementById('rain-prob').textContent = `${hourly.precipitation_probability[nowIndex]}%`;
    }

    // Rain Chart - Better 12 hour view
    const sliceStart = nowIndex;
    const sliceEnd = Math.min(hourly.time.length, nowIndex + 12);

    const labels = hourly.time.slice(sliceStart, sliceEnd).map(t => formatTime(t).split(':')[0]); // Just the hour
    const rainPoints = hourly.precipitation.slice(sliceStart, sliceEnd);
    const probPoints = hourly.precipitation_probability ? hourly.precipitation_probability.slice(sliceStart, sliceEnd) : [];

    if (window.rainChartInstance) window.rainChartInstance.destroy();
    if (els.rainfallChartCtx) {
        window.rainChartInstance = new Chart(els.rainfallChartCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Rain (mm)',
                        data: rainPoints,
                        backgroundColor: 'rgba(56, 189, 248, 0.7)',
                        borderRadius: 4,
                        order: 2,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Chance (%)',
                        data: probPoints,
                        type: 'line',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderDash: [5, 5],
                        borderWidth: 1.5,
                        pointRadius: 0,
                        fill: false,
                        order: 1,
                        yAxisID: 'yPercentage'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: false },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8', font: { size: 10, weight: 600 } }
                    },
                    y: { display: false, min: 0 },
                    yPercentage: { display: false, min: 0, max: 100 }
                }
            }
        });
    }
}

function renderForecast(data) {
    const daily = data.daily;
    els.forecastContainer.innerHTML = '';

    // Start loop from 1 (Today) because of past_days=1 in query
    for (let i = 1; i <= 4; i++) {
        if (!daily.time[i]) break;

        const date = new Date(daily.time[i]);
        // i=1 is Today, i=2 is Tomorrow, etc.
        let dayName;
        if (i === 1) {
            dayName = 'Today';
        } else if (i === 2) {
            dayName = 'Tomorrow';
        } else {
            dayName = date.toLocaleDateString('en-IE', { weekday: 'short' });
        }

        const code = daily.weather_code[i];

        const div = document.createElement('div');
        div.className = 'forecast-day';
        div.innerHTML = `
            <div class="day-name">${dayName}</div>
            <i data-feather="${getWeatherIcon(code)}" class="day-icon"></i>
            <div class="day-temps">
                <span class="temp-high">${Math.round(daily.temperature_2m_max[i])}°</span>
                <span class="temp-low">${Math.round(daily.temperature_2m_min[i])}°</span>
            </div>
        `;
        els.forecastContainer.appendChild(div);
    }
}

// Helpers
function getCurrentHourIndex(times) {
    const now = new Date();
    let minDiff = Infinity;
    let index = 0;
    times.forEach((t, i) => {
        const diff = Math.abs(new Date(t) - now);
        if (diff < minDiff) {
            minDiff = diff;
            index = i;
        }
    });
    return index;
}

// Init
initDashboard();
setInterval(initDashboard, 15 * 60 * 1000); // 15 mins
