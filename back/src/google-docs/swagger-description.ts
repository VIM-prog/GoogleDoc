export const operation = {
  drives: {
    summary: 'Получить список дисков Google Drive',
    description: 'Возвращает список всех дисков, которые доступны вам',
  },
  docs: {
    summary: 'Получить документы',
    description: 'Возвращает список всех документов, которые доступны вам',
  },
  drivesWithEmail: {
    summary: 'Получить список дисков Google Drive',
    description: 'Возвращает список всех дисков, которые доступны пользователю',
  },
  docsWithEmail: {
    summary: 'Получить список документов другого пользователя',
    description:
      'Возвращает список всех документов которые доступны другому пользователю',
  },
  deleteOne: {
    summary: 'Удаление доступа к файлу',
    description:
      'Удаляет доступ к файлу, к которому имеет право доступ другой пользователь',
  },
  deletePermDrive: {
    summary: 'Удаление доступа к диску',
    description:
      'Удаляет доступ к диску, к которому имеет право доступ другой пользователь',
  },
  deleteAllPerm: {
    summary: 'Удаление доступа ко всему',
    description:
      'Удаляет доступ ко всем файлам и дискам, к которому имеет право доступ другой пользователь',
  },
};

export const params = {
  email: {
    name: 'email',
    description: 'Введите email',
  },
  driveId: {
    name: 'driveId',
    description: 'Введите id диска, к которому заберете доступ',
  },
  fileId: {
    name: 'fileId',
    description: 'Введите id файла, к которому заберете доступ',
  },
};

export const statusesOk = {
  drives: {
    status: 200,
    description: 'Успешное получение списка дисков',
  },
  docs: {
    status: 200,
    description: 'Успешное получение списка документов',
  },
  drivesWithEmail: {
    status: 200,
    description: 'Успешное получение списка дисков',
  },
  docsWithEmail: {
    status: 200,
    description: 'Успешное получение списка документов',
  },
  deleteOne: {
    status: 200,
    description: 'Получения сообщения об успешном удалении',
  },
  deletePermDrive: {
    status: 200,
    description: 'Получения сообщения об успешном удалении',
  },
  deleteAllPerm: {
    status: 200,
    description: 'Получения сообщения об успешном удалении',
  },
};

//todo вынести статус ok в отдельную группу, добавив возвращающиеся параметры из dto
export const statusesError = {
  unauthorized: {
    status: 401,
    description: 'Ошибка аутентификации',
  },
  inside: {
    status: 500,
    description: 'Внутренняя ошибка сервера',
  },
  inheritedPerm: {
    status: 400,
    description: 'Невозможно удалить наследованное разрешение',
  },
};
