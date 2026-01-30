// 농부들을 위한 직관적인 상태 표시 유틸리티

export interface FarmCondition {
    status: 'excellent' | 'good' | 'caution' | 'warning' | 'unknown';
    emoji: string;
    message: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

/**
 * 안전한 숫자 변환 (null/undefined/NaN 방어)
 */
function safeNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined || isNaN(value)) {
        return defaultValue;
    }
    return Number(value);
}

/**
 * VPD 값을 기반으로 신호등 색상과 메시지를 반환
 */
export function getVPDSignal(vpd: number | null | undefined): {
    color: string;
    emoji: string;
    message: string;
} {
    // null/undefined 체크
    if (vpd === null || vpd === undefined || isNaN(vpd)) {
        return {
            color: 'text-gray-600',
            emoji: '⚪',
            message: '데이터 없음'
        };
    }

    const safeVpd = safeNumber(vpd, 0);

    if (safeVpd < 0.4) {
        return {
            color: 'text-red-600',
            emoji: '🔴',
            message: '위험! 곰팡이 조심!'
        };
    } else if (safeVpd < 0.8) {
        return {
            color: 'text-yellow-600',
            emoji: '🟡',
            message: '주의 필요'
        };
    } else if (safeVpd <= 1.2) {
        return {
            color: 'text-green-600',
            emoji: '🟢',
            message: '좋음'
        };
    } else if (safeVpd <= 1.6) {
        return {
            color: 'text-yellow-600',
            emoji: '🟡',
            message: '조금 건조함'
        };
    } else {
        return {
            color: 'text-red-600',
            emoji: '🔴',
            message: '위험! 응애 조심!'
        };
    }
}

/**
 * 전체 농사 컨디션을 종합 평가
 */
export function getFarmCondition(
    indoorVPD: number | null | undefined,
    temperature: number | null | undefined,
    humidity: number | null | undefined,
    rain: number | null | undefined
): FarmCondition {
    // 데이터 유효성 검사
    if (indoorVPD === null || indoorVPD === undefined || isNaN(indoorVPD)) {
        return {
            status: 'unknown',
            emoji: '❓',
            message: '데이터 수집 중...',
            color: 'text-gray-700',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200'
        };
    }

    const safeVpd = safeNumber(indoorVPD, 0);
    const safeTemp = safeNumber(temperature, 70);
    const safeHumidity = safeNumber(humidity, 50);
    const safeRain = safeNumber(rain, 0);

    const vpdSignal = getVPDSignal(safeVpd);

    // 위험 조건 체크
    if (safeVpd < 0.4 || safeVpd > 1.6) {
        return {
            status: 'warning',
            emoji: '⚠️',
            message: `${vpdSignal.message} - 즉시 조치 필요`,
            color: 'text-red-700',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200'
        };
    }

    // 주의 조건
    if (safeVpd < 0.8 || safeVpd > 1.2) {
        return {
            status: 'caution',
            emoji: '🟡',
            message: '주의 - 환경 점검 권장',
            color: 'text-yellow-700',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200'
        };
    }

    // 비가 많이 오는 경우
    if (safeRain > 10) {
        return {
            status: 'caution',
            emoji: '🌧️',
            message: '비 예보 - 배수 확인',
            color: 'text-blue-700',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        };
    }

    // 온도가 너무 높거나 낮은 경우
    if (safeTemp > 95 || safeTemp < 40) {
        return {
            status: 'caution',
            emoji: safeTemp > 95 ? '🔥' : '❄️',
            message: safeTemp > 95 ? '고온 주의' : '저온 주의',
            color: 'text-orange-700',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200'
        };
    }

    // 모든 조건이 양호
    return {
        status: 'excellent',
        emoji: '☀️',
        message: '오늘의 농사 컨디션: 맑음',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
    };
}

/**
 * 온도를 색상으로 표현
 */
export function getTemperatureColor(temp: number | null | undefined): string {
    const safeTemp = safeNumber(temp, 70);
    if (safeTemp < 50) return 'text-blue-600';
    if (safeTemp < 70) return 'text-green-600';
    if (safeTemp < 85) return 'text-yellow-600';
    return 'text-red-600';
}

/**
 * 습도를 색상으로 표현
 */
export function getHumidityColor(humidity: number | null | undefined): string {
    const safeHumidity = safeNumber(humidity, 50);
    if (safeHumidity < 30) return 'text-red-600';
    if (safeHumidity < 50) return 'text-yellow-600';
    if (safeHumidity <= 70) return 'text-green-600';
    return 'text-blue-600';
}
