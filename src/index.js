import React from 'react';
import ReactDOM from "react-dom";
import * as serviceWorker from './serviceWorker';

const StoreContext = React.createContext({});

// Slomux — упрощённая, сломанная реализация Flux.
// Перед вами небольшое приложение, написанное на React + Slomux.
// Это нерабочий секундомер с настройкой интервала обновления.

// Исправьте ошибки и потенциально проблемный код, почините приложение и прокомментируйте своё решение.

// При нажатии на "старт" должен запускаться секундомер и через заданный интервал времени увеличивать свое значение на значение интервала
// При нажатии на "стоп" секундомер должен останавливаться и сбрасывать свое значение

const createStore = (reducer, initialState) => {
    let currentState = initialState;
    const listeners = [];

    const getState = () => currentState;
    const dispatch = action => {
        currentState = reducer(currentState, action);
        listeners.forEach(listener => listener());
    };

    const subscribe = listener => listeners.push(listener);

    return { getState, dispatch, subscribe };
};

const connect = (mapStateToProps, mapDispatchToProps) => Component => {
    class WrappedComponent extends React.Component {
        static contextType = StoreContext;
        render() {
            return (
                <Component
                    {...this.props}
                    {...mapStateToProps(this.context.store.getState(), this.props)}
                    {...mapDispatchToProps(this.context.store.dispatch, this.props)}
                />
            );
        }

        componentDidMount() {
            this.context.store.subscribe(this.handleChange);
        }

        handleChange = () => {
            this.forceUpdate();
        };
    }

    return WrappedComponent;
};

class Provider extends React.Component {
    render() {
        return (
            // пробросил стор через контекст в функцию connect
            <StoreContext.Provider value={{ store: this.props.store }}>
                {React.Children.only(this.props.children)}
            </StoreContext.Provider>
        );
    }
}

// APP

// actions
const CHANGE_INTERVAL = "CHANGE_INTERVAL";
// Добавил экшены
const RUN_COUNTER = "RUN_COUNTER";
const INCREASE_COUNTER = "INCREASE_COUNTER";
const CLEAR_COUNTER = "CLEAR_COUNTER";

// action creators
const changeInterval = value => ({
    type: CHANGE_INTERVAL,
    payload: value
});

// Добавил экшен креаторы
const runCounter = () => ({
    type: RUN_COUNTER
});

const increaseCounter = value => ({
    type: INCREASE_COUNTER,
    payload: value
});

const clearCounter = () => ({
    type: CLEAR_COUNTER
});

// reducers
// Добавил редьюсеры, чтобы выполнять необходимые операции над стором.
// Использовал "жирные редьюсеры", например, редьюсер CHANGE_INTERVAL
// не позволяет задать нулевой или отрицательный шаг
const reducer = (state, { type, payload }) => {
    switch (type) {
        case CHANGE_INTERVAL:
            const newInterval = state.currentInterval + payload;
            const currentInterval = newInterval <= 0 ? 1000 : newInterval;
            return {
                ...state,
                currentInterval
            };
        case RUN_COUNTER:
            return {
                ...state,
                isRunning: true
            };
        case INCREASE_COUNTER:
            return {
                ...state,
                currentTime: state.currentTime + state.currentInterval,
                isRunning: true
            };
        case CLEAR_COUNTER:
            return {
                ...state,
                currentTime: 0,
                isRunning: false
            };
        default:
            return state;
    }
};

// Инициализировал стор и заполнил его значениями по умолчанию
const store = createStore(reducer, {
    currentTime: 0,
    currentInterval: 1000,
    isRunning: false
});

// Добавил функцию-хелпер, чтобы выводить миллисекунды в секундах и представлять
// их пользователю в более удобочитаемом виде
const convertMillisecondsToSeconds = val => (val / 1000).toFixed(0);

// components
// Сделал компоненты функциональными, из-за экономии на методах жизненного цикла
// Применил деструктуризацию пропов полученных из стора
function IntervalComponent({ currentInterval, isRunning, changeInterval }) {
    return (
        <div>
            <span>
                Интервал обновления секундомера:
                {convertMillisecondsToSeconds(currentInterval)} сек.
            </span>
            <span>
                <button onClick={() => changeInterval(-1000)} disabled={isRunning}>
                    -
                </button>
                <button onClick={() => changeInterval(1000)} disabled={isRunning}>
                    +
                </button>
            </span>
        </div>
    );
}

// тут были перепутаны местами mapStateToProps и mapDispatchToProps
// Забрал нужную информацию из стора и привязал экшен креатор
const Interval = connect(
    ({ currentInterval, isRunning }) => ({
        currentInterval,
        isRunning
    }),
    dispatch => ({
        changeInterval: value => dispatch(changeInterval(value))
    })
)(IntervalComponent);

let timer = null;

// избавился от локального стейта и текущее время теперь хранится в хранилище
function TimerComponent({isRunning, currentTime, currentInterval, runCounter, increaseCounter, clearCounter}) {

    // Добавил метод запуска таймера, он проверяет, чтобы таймер не был уже
    // запущенным и запускает счетчик + записывает ссылку на счетчик и начинает
    // увеличивать счетчик на текущий интервал через заданный текущий интервал
    const handleStart = () => {
        if (isRunning) return;
        runCounter();
        timer = setInterval(
            () => increaseCounter(currentInterval),
            currentInterval
        );
    };

    // Метод останавливает setInterval и очищает счетчик
    const handleStop = () => {
        clearInterval(timer);
        clearCounter();
    };

    return (
        <div>
            <Interval />
            <div>Секундомер: {convertMillisecondsToSeconds(currentTime)} сек.</div>
            <div>
                <button onClick={handleStart}>Старт</button>
                <button onClick={handleStop}>Стоп</button>
            </div>
        </div>
    );
}

// прокинул поля из стора в пропсы, и привязал экшен-креаторы
const Timer = connect(
    ({ isRunning, currentInterval, currentTime }) => ({
        isRunning,
        currentInterval,
        currentTime
    }),
    dispatch => ({
        increaseCounter: value => dispatch(increaseCounter(value)),
        runCounter: () => dispatch(runCounter()),
        clearCounter: () => dispatch(clearCounter())
    })
)(TimerComponent);

// init
ReactDOM.render(
    <Provider store={store}>
        <Timer />
    </Provider>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
