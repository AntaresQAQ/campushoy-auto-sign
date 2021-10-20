interface TaskItem {
  readonly stuSignWid: string;
  readonly signInstanceWid: string;
  readonly signWid: string;
  readonly signRate: string;
  readonly taskType: string;
  readonly taskName: string;
  readonly senderUserName: string;
  readonly signStatus: string;
  readonly isMalposition: string;
  readonly isLeave: string;
  readonly leavePcUrl: string;
  readonly leaveMobileUrl: string;
  readonly currentTime: string;
  readonly singleTaskBeginTime: string;
  readonly singleTaskEndTime: string;
  readonly rateSignDate: string;
  readonly rateTaskBeginTime: string;
  readonly rateTaskEndTime: string;
}

interface GetStuSignInfosInOneDayApiDatas {
  readonly dayInMonth: string;
  readonly codeRcvdTasks: TaskItem[];
  readonly signedTasks: TaskItem[];
  readonly unSignedTasks: TaskItem[];
  readonly leaveTasks: TaskItem[];
}

export interface GetStuSignInfosInOneDayApi {
  readonly code: string;
  readonly message: string;
  readonly datas: GetStuSignInfosInOneDayApiDatas;
}
