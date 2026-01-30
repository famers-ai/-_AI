// 농부들을 위한 직관적인 상태 표시 유틸리티

export interface FarmCondition {
    status: 'excellent' | 'good' | 'caution' | 'warning';
    emoji: string;
    message: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

/**
 * VPD 값을 기반으로 신호등 색상과 메시지를 반환
 */
export function getVPDSignal(vpd: number): {
    color: string;
    emoji: string;
    message: string;
} {
    if (vpd < 0.4) {
        return {
            color: 'text-red-600',
            emoji: '🔴',
            message: '위험! 곰팡이 조심!'
        };
    } else if (vpd < 0.8) {
        return {
            color: 'text-yellow-600',
            emoji: '🟡',
            message: '주의 필요'
        };
    } else if (vpd <= 1.2) {
        return {
            color: 'text-green-600',
            emoji: '🟢',
            message: '좋음'
        };
    } else if (vpd <= 1.6) {
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
    indoorVPD: number,
    temperature: number,
    humidity: number,
    rain: number
): FarmCondition {
    const vpdSignal = getVPDSignal(indoorVPD);

    // 위험 조건 체크
    if (indoorVPD < 0.4 || indoorVPD > 1.6) {
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
    if (indoorVPD < 0.8 || indoorVPD > 1.2) {
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
    if (rain > 10) {
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
    if (temperature > 95 || temperature < 40) {
        return {
            status: 'caution',
            emoji: temperature > 95 ? '🔥' : '❄️',
            message: temperature > 95 ? '고온 주의' : '저온 주의',
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
export function getTemperatureColor(temp: number): string {
    if (temp < 50) return 'text-blue-600';
    if (temp < 70) return 'text-green-600';
    if (temp < 85) return 'text-yellow-600';
    return 'text-red-600';
}

/**
 * 습도를 색상으로 표현
 */
export function getHumidityColor(humidity: number): string {
    if (humidity < 30) return 'text-red-600';
    if (humidity < 50) return 'text-yellow-600';
    if (humidity <= 70) return 'text-green-600';
    return 'text-blue-600';
}
