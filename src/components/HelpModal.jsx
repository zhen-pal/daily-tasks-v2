import { useState } from 'react'

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">📋 Помощь: Мои задачи</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Контент с прокруткой */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Приватность */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              🔒 Приватность
            </h3>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-gray-700 font-medium">
                Ваши задачи видны только вам. Никто другой не имеет к ним доступа.
              </p>
            </div>
          </section>

          {/* Начало работы */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              🚀 Начало работы
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">1. Вход</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>Нажмите <strong>«Зарегистрироваться»</strong> и введите имя (минимум 3 буквы), email и пароль</li>
                  <li>Или нажмите <strong>«Продолжить через Google»</strong> — быстрый вход в один клик</li>
                  <li>При следующем входе просто введите email и пароль</li>
                  <li>Не помните пароль? Нажмите <strong>«Забыли пароль?»</strong> — придёт письмо — зададите новый</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">2. Выберите дату</h4>
                <p className="text-gray-600 ml-4">Нажмите на календарь вверху — выберите день, задачи которого хотите увидеть.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">3. Добавьте задачу</h4>
                <p className="text-gray-600 mb-2 ml-4">Нажмите <strong>«➕ Добавить задачу»</strong> и заполните:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-8">
                  <li><strong>Название</strong> — что сделать (обязательно)</li>
                  <li><strong>Дата</strong> — когда выполнить</li>
                  <li><strong>Время</strong> — во сколько (необязательно)</li>
                  <li><strong>Приоритет</strong> — 🔴 Высокий, 🟡 Средний, 🟢 Низкий</li>
                  <li><strong>Статус</strong> — 🆕 Новое, ⚙️ В работе, ⏸️ На паузе, ✅ Выполнено</li>
                  <li><strong>Описание</strong> — подробности (до 500 символов, необязательно)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Голосовой ввод */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              🎤 Голосовой ввод
            </h3>
            <p className="text-gray-600 ml-4">
              Нажмите <strong>🎤</strong> рядом с полем ввода и скажите задачу. Работает в названии и описании.
            </p>
          </section>

          {/* Быстрые действия */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              ⚡ Быстрые действия
            </h3>
            <p className="text-gray-600 mb-2 ml-4"><strong>В списке задач:</strong></p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-8">
              <li>Кликните на <strong>статус</strong> (например, «Новое») → выберите другой</li>
              <li>Кликните на <strong>приоритет</strong> (например, «Средний») → измените</li>
              <li>Кликните на <strong>кружок слева</strong> → отметить выполненной</li>
              <li>Нажмите <strong>📋</strong> → скопировать задачу на сегодня</li>
              <li>Нажмите <strong>✏️</strong> → редактировать</li>
              <li>Нажмите <strong>🗑️</strong> → удалить</li>
            </ul>
          </section>

          {/* Перенос задачи */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              📅 Перенос задачи
            </h3>
            <ol className="list-decimal list-inside text-gray-600 space-y-1 ml-4">
              <li>Откройте задачу (✏️)</li>
              <li>Измените дату</li>
              <li>Нажмите «Сохранить»</li>
              <li>Выберите: <strong>Перенести</strong> (удалить со старой даты) или <strong>Скопировать</strong> (оставить на обеих)</li>
            </ol>
          </section>

          {/* Экспорт */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              📥 Экспорт
            </h3>
            <p className="text-gray-600 ml-4">
              Нажмите <strong>«📥 Экспорт»</strong> — скачается файл CSV со всеми задачами дня (откроется в Excel).
            </p>
          </section>

          {/* Советы */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              💡 Советы
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Планируйте с вечера на завтра</li>
              <li>Используйте описание для подробностей</li>
              <li>Статус «На паузе» — для важных, но отложенных дел</li>
              <li>Задачи со временем сортируются по часам</li>
              <li>Задачи сортируются по приоритетам (сначала 🔴 Высокий, потом 🟡 Средний, затем 🟢 Низкий)</li>
            </ul>
          </section>

          {/* Вопросы */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              ❓ Вопросы?
            </h3>
            <p className="text-gray-600 ml-4">
              Если что-то непонятно или нашли ошибку — сообщите Жене или напишите{' '}
              <a href="mailto:zhenya-makarova@yandex.ru" className="text-indigo-600 hover:text-indigo-800 underline">
                zhenya-makarova@yandex.ru
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}