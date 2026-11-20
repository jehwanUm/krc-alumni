// 진단 코드 표 — 기리고차 core의 MessagesKo.java와 같아야 한다 (코드를 더하면 여기도).
export type Code = { code: string; what: string; fix: string; auto: boolean };
export const CODE_GROUPS: { name: string; rows: Code[] }[] = [
  {
    "name": "설정 · 시작 전",
    "rows": [
      {
        "code": "E001",
        "what": "robot.json 형식이나 값이 잘못됐어요",
        "fix": "/sdcard/FIRST/girigocha/robot.json 을 고친 뒤 OpMode 다시 실행",
        "auto": false
      },
      {
        "code": "E002",
        "what": "설정 이름의 장치를 찾지 못했어요",
        "fix": "Configure Robot 이름과 robot.json 이름이 글자 하나까지 같은지",
        "auto": false
      }
    ]
  },
  {
    "name": "모터 · 시작 전",
    "rows": [
      {
        "code": "E101",
        "what": "한 모터의 방향이 반대예요",
        "fix": "그 모터의 \"reversed\"를 반대로 (true↔false)",
        "auto": true
      },
      {
        "code": "E102",
        "what": "모터는 도는데 엔코더 값이 바뀌지 않아요",
        "fix": "엔코더 케이블이 같은 번호 엔코더 포트에 꽂혔는지",
        "auto": false
      },
      {
        "code": "E103",
        "what": "한 모터를 돌렸는데 다른 바퀴 엔코더가 움직였어요",
        "fix": "엔코더 케이블을 모터 전원 케이블과 같은 포트 번호로",
        "auto": false
      },
      {
        "code": "E104",
        "what": "모터가 돌지 않았어요",
        "fix": "모터 전원 케이블, 허브 포트 번호, Configure Robot의 모터 종류",
        "auto": false
      },
      {
        "code": "W105",
        "what": "앞으로 돌렸는데 엔코더 값이 줄었어요",
        "fix": "외부 엔코더면 방향이 반대일 수 있어요. 로그를 보내 주세요",
        "auto": false
      },
      {
        "code": "W106",
        "what": "바퀴는 돌았지만 로봇이 회전하지 않았어요",
        "fix": "로봇을 매트에 내려놓고 다시. 바닥이었다면 IMU 설정 이름",
        "auto": false
      },
      {
        "code": "W107",
        "what": "옆으로 갈 때 로봇이 많이 돌았어요",
        "fix": "메카넘 롤러가 위에서 봤을 때 X자인지, 바퀴가 바뀌어 끼워지지 않았는지",
        "auto": false
      },
      {
        "code": "W108",
        "what": "바퀴 하나가 다른 바퀴보다 훨씬 덜 돌아요",
        "fix": "그 바퀴를 손으로 돌려 보세요 — 벨트가 너무 팽팽한지, 기어·나사가 걸리는지, 모터 케이블이 헐거운지",
        "auto": false
      },
      {
        "code": "W109",
        "what": "앞으로 갈 때 로봇이 많이 돌았어요",
        "fix": "한쪽 바퀴가 덜 돌아요. 뻑뻑한 바퀴가 없는지, 모터 기어비가 모두 같은지",
        "auto": false
      }
    ]
  },
  {
    "name": "위치 센서 · 시작 전",
    "rows": [
      {
        "code": "E201",
        "what": "Pinpoint가 준비되지 않았어요 (데드휠 미연결, IMU 흐름, 통신)",
        "fix": "Pinpoint 케이블(I2C·데드휠) 확인, 로봇을 움직이지 않은 채 다시 시작",
        "auto": false
      },
      {
        "code": "E202",
        "what": "네 바퀴가 모두 반대 방향으로 측정됐어요",
        "fix": "Pinpoint 라벨이 위를 보는지, imu.logo·imu.usb가 실제와 같은지. 맞다면 네 모터 reversed를 모두 반대로",
        "auto": false
      },
      {
        "code": "E203",
        "what": "데드휠 방향이 반대예요",
        "fix": "그 데드휠의 \"reversed\"를 반대로",
        "auto": true
      },
      {
        "code": "E204",
        "what": "로봇이 움직였는데 데드휠 값이 거의 안 바뀌어요",
        "fix": "데드휠이 바닥에 닿는지(스프링), 케이블이 encoderPort에 꽂혔는지",
        "auto": false
      },
      {
        "code": "E205",
        "what": "데드휠 위치 값의 부호가 실제와 반대예요",
        "fix": "평행 데드휠은 \"y\"(왼쪽 +), 수직 데드휠은 \"x\"(앞 +) 부호",
        "auto": true
      },
      {
        "code": "W205",
        "what": "데드휠 위치 값이 실제와 몇 % 달라요",
        "fix": "로봇 중심에서 데드휠까지 거리를 다시 재기",
        "auto": false
      }
    ]
  },
  {
    "name": "주행 중 감시",
    "rows": [
      {
        "code": "E204",
        "what": "주행 중 데드휠 값이 멈췄어요. 위치를 믿을 수 없어 멈춰요",
        "fix": "데드휠 케이블이 빠졌는지, 바퀴가 바닥에서 떴는지. 고친 뒤 점검 다시",
        "auto": false
      },
      {
        "code": "W104",
        "what": "한 바퀴가 거의 돌지 않아요. 나머지 바퀴로 계속 가요",
        "fix": "모터 전원·엔코더 케이블, 기어박스",
        "auto": false
      },
      {
        "code": "E206",
        "what": "IMU 값이 멈췄어요 (3개 구성은 데드휠만으로 계속)",
        "fix": "Control Hub를 다시 켜고, 계속되면 로그를 보내 주세요",
        "auto": false
      },
      {
        "code": "L001",
        "what": "센서 값이 숫자가 아니에요 (NaN)",
        "fix": "센서 연결을 확인하고 로그를 보내 주세요",
        "auto": false
      },
      {
        "code": "L002",
        "what": "Pinpoint 위치가 한 번에 크게 튀었어요",
        "fix": "Pinpoint 케이블과 장착 확인",
        "auto": false
      },
      {
        "code": "E301",
        "what": "프로그램 루프가 멈춰 모터를 정지시켰어요",
        "fix": "루프 안의 sleep이나 오래 걸리는 동작(카메라 처리 등)",
        "auto": false
      }
    ]
  },
  {
    "name": "환경",
    "rows": [
      {
        "code": "W301",
        "what": "배터리 전압이 낮아요",
        "fix": "충전된 배터리로. 12.5 V 이상 권장",
        "auto": false
      },
      {
        "code": "W302",
        "what": "제어 주기가 느려요 (50 Hz 미만)",
        "fix": "루프 안의 sleep이나 추가 센서 읽기를 줄이기",
        "auto": false
      }
    ]
  },
  {
    "name": "알림",
    "rows": [
      {
        "code": "I000",
        "what": "모든 점검을 통과했어요",
        "fix": "이제 경로를 달려도 돼요",
        "auto": false
      },
      {
        "code": "I001",
        "what": "앞의 오류 때문에 데드휠 점검은 건너뛰었어요",
        "fix": "오류를 고친 뒤 점검 다시",
        "auto": false
      },
      {
        "code": "I002",
        "what": "점검을 중간에 멈췄어요",
        "fix": "점검을 다시 실행하세요",
        "auto": false
      },
      {
        "code": "I003",
        "what": "로봇이 제자리에서 돌지 못해 데드휠 위치는 확인하지 않았어요",
        "fix": "위의 바퀴 문제를 고친 뒤 점검을 다시 실행하세요",
        "auto": false
      }
    ]
  }
];
