import { useState } from 'react'

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">📋 Помощь: еЖЕдневНЯ</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
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

          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              🚀 Начало работы
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">1. Вход</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>Нажмите <strong>«Зарегистрироваться»</strong> и введите имя (минимум 3 буквы), email и пароль. При следующем входе просто введите эти email и пароль.</li>
                  <li>Или нажмите <strong>«Продолжить через Google»</strong> — быстрый вход в один клик</li>
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
                  <li><strong>Название</strong> — что сделать</li>
                  <li><strong>Дата</strong> — когда выполнить</li>
                  <li><strong>Время</strong> — во сколько в формате ЧЧ:ММ (например <code className="bg-gray-100 px-1 rounded">14:30</code>)</li>
                  <li><strong>Приоритет</strong> —  Высокий, 🟡 Средний,  Низкий</li>
                  <li><strong>Статус</strong> — 🆕 Новое, ⚙️ В работе, ⏸️ На паузе, ✅ Выполнено</li>
                  <li><strong>Описание</strong> — подробности (до 500 символов)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              🎤 Голосовой ввод
            </h3>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded space-y-2">
              <p className="text-gray-700">
                Нажмите <strong></strong> рядом с полем ввода — начнётся запись. Текст будет появляться прямо в поле по мере того, как вы говорите.
              </p>
              <p className="text-gray-700">
                Нажмите <strong>️</strong> (та же кнопка) — запись остановится.
              </p>
              <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
                <li>Работает в названии и описании задачи</li>
                <li>Во время записи поле описания временно блокируется для редактирования руками</li>
                <li>Можно переключаться между полями во время записии — запись автоматически продолжится в новом поле</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              ⚡ Быстрые действия
            </h3>
            <p className="text-gray-600 mb-2 ml-4"><strong>В списке задач:</strong></p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-8">
              <li>Кликните на <strong>статус</strong> → выберите другой</li>
              <li>Кликните на <strong>приоритет</strong> → измените</li>
              <li>Кликните на <strong>кружок слева</strong> → отметить выполненной</li>
              <li>Нажмите <strong>📋</strong> → скопировать задачу на сегодня</li>
              <li>Нажмите <strong>✏️</strong> → редактировать</li>
              <li>Нажмите <strong>🗑️</strong> → удалить</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
               Перенос задачи
            </h3>
            <ol className="list-decimal list-inside text-gray-600 space-y-1 ml-4">
              <li>Откройте задачу (✏️)</li>
              <li>Измените дату</li>
              <li>Нажмите «Сохранить»</li>
              <li>Выберите: <strong>Перенести</strong> или <strong>Скопировать</strong></li>
            </ol>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
               Экспорт
            </h3>
            <p className="text-gray-600 ml-4">
              Нажмите <strong>«📥 Экспорт»</strong> — скачается файл CSV со всеми задачами дня.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              💡 Советы
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Планируйте с вечера на завтра</li>
              <li>Используйте описание для подробностей</li>
              <li>Статус «На паузе» — для важных, но отложенных дел</li>
              <li>Задачи со временем сортируются по часам</li>
              <li>Задачи сортируются по приоритетам</li>
              <li>Время удобно вводить: набирайте цифры, двоеточие подставится само</li>
            </ul>
          </section>

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