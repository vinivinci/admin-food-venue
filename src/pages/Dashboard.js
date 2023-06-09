import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';
import { Stomp } from '@stomp/stompjs';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import DataTable from '../components/DataTable';
import Input from '../components/Input';
import Modal from '../components/Modal';
import OrderStatusStepper from '../components/OrderStatusStepper';
import Toast from '../components/Toast';
import ToggleButton from '../components/ToggleButton';
import { RestaurantContext } from '../context/RestauranteContext';
import useAxiosInstance from '../utils/axiosInstance';

const OrderPage = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [openModalInfo, setOpenModalInfo] = useState(false);
    const [openModalStatus, setOpenModalStatus] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('error');
    const [toastTitle, setToastTitle] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orders, setOrders] = useState(null);
    const [openModalCancel, setOpenModalCancel] = useState(false);
    const { data, setUsuario, setRestaurante } = useContext(RestaurantContext);
    const axiosInstance = useAxiosInstance()
    const toggleOpen = () => {
        axiosInstance.put('/api/restaurantes/status', { aberto: !isOpen }).then((resp => {
            setUsuario(resp?.data?.usuario)
            setRestaurante({
                aberto: resp?.data?.aberto,
                descricao: resp?.data?.descricao,
                id: resp?.data?.id,
                imagem: resp?.data?.imagem,
                nome: resp?.data?.nome,
            })
        }))
    }

    const handleOpenModalCancel = (order) => {
        setSelectedOrder(order);
        setOpenModalCancel(true);
    };

    const handleCloseModalCancel = () => {
        setOpenModalCancel(false);
    };

    const handleCancelPedido = () => {
        axiosInstance.put(`/api/pedidos/${selectedOrder.id}/cancelar`)
            .then(() => {
                getOrders();
                setToastMessage("Pedido cancelado com sucesso!");
                setToastType('success');
                setToastTitle('Sucesso ao cancelar');
                setToastVisible(true);
                setOpenModalCancel(false);
            })
            .catch(() => {
                setToastMessage("Ocorreu um erro ao cancelar o pedido. Verifique as informações e tente novamente!");
                setToastType('error');
                setToastTitle('Erro interno');
                setToastVisible(true);
            });
    };

    const getOrders = useCallback(() => {
        if (data?.restaurante?.id) {
            axiosInstance.get(`/api/pedidos/restaurante/${data?.restaurante?.id}`)
                .then((resp) => {
                    if (resp.data) {
                        setOrders(resp.data);
                    }
                })
                .catch((err) => {
                    setToastMessage("Ouve um erro no servidor, aguarde algum tempo e tente novamente")
                    setToastType('error')
                    setToastTitle('Erro interno')
                    setToastVisible(true);
                });
        }

    }, [data, axiosInstance]);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/mywebsockets');
        const stompClient = Stomp.over(socket);

        stompClient.connect(
            {
                Authorization: localStorage.getItem('token')
            },
            (frame) => {
                stompClient.subscribe(`/topic/pedidos/new/${data?.restaurante?.id}`, (message) => {
                    if (message.body) {
                        try {
                            const parsedBody = JSON.parse(message.body);
                            setOrders(prevOrders => [...prevOrders, parsedBody]);
                        } catch (error) {
                            console.error('Erro ao processar a mensagem:', error);
                        }
                    }
                });
            },
            (error) => {
                console.error('Erro no WebSocket:', error);
            }
        );

        return () => {
            if (stompClient) {
                stompClient.disconnect(() => {
                    console.log('Desconectado do WebSocket');
                });
            }
        };
    }, [data, setOrders]);


    const setNextStepStatusOrder = () => {
        axiosInstance.put(`/api/pedidos/${selectedOrder.id}`, {
            ...selectedOrder,
            status: getNextStatus(selectedOrder.status)
        }).then(() => {
            getOrders()
            setToastMessage("Etapa avançada com sucesso!")
            setToastType('success')
            setToastTitle('Sucesso ao editar')
            setToastVisible(true);
        }).catch(() => {
            setToastMessage("Ouve um erro ao avançar etápa do pedido, cheque as informações e tente novamente!")
            setToastType('error')
            setToastTitle('Erro interno')
            setToastVisible(true);
        })
    }

    const getNextStatus = (status) => {
        const currentIndex = mapStatusOrder.findIndex(item => item.name === status);
        if (currentIndex !== -1 && currentIndex < mapStatusOrder.length - 1) {
            return mapStatusOrder[currentIndex + 1].name;
        }
        return null;
    };

    const mapStatusOrder = [
        {
            name: "AGUARDANDO_APROVACAO",
            patternedName: 'Aguardando aprovação'
        },
        {
            name: "PREPARANDO",
            patternedName: 'Preparando'
        },
        {
            name: "A_CAMINHO",
            patternedName: 'A caminho'
        },
        {
            name: "ENTREGUE",
            patternedName: 'Entregue'
        },
        {
            name: "CANCELADO",
            patternedName: 'Cancelado'
        },
    ]

    const getPatternedStatusName = (name) => {
        const status = mapStatusOrder.find(status => status.name === name);
        return status ? status.patternedName : '';
    };

    useEffect(() => {
        setIsOpen(data?.restaurante?.aberto);
        getOrders();
    }, [data, setIsOpen, getOrders]);

    const handleOpenModalInfo = (order) => {
        setSelectedOrder(order);
        setOpenModalInfo(true);
    };

    const handleCloseModalInfo = () => {
        setOpenModalInfo(false);
    };

    const handleOpenModalStatus = (order) => {
        setSelectedOrder(order);
        setOpenModalStatus(true);
    };
    const handleSaveModalStatus = () => {
        if (selectedOrder.status === "CANCELADO") {
            setToastMessage("Não é possível alterar o status de um pedido cancelado!");
            setToastType('error');
            setToastTitle('Erro ao alterar status');
            setToastVisible(true);
            return;
        }
        setNextStepStatusOrder();
        setOpenModalStatus(false);
    };

    const handleCloseModalStatus = () => {
        setOpenModalStatus(false);
    };

    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        const filteredOrders = filterOrders(query);
        setOrders(filteredOrders);

        if (query === '') {
            getOrders();
        }
    };

    const filterOrders = (query) => {
        if (!query) {
            return orders;
        }

        return orders.filter((order) => {
            const clientName = order.cliente.nome.toLowerCase().includes(query);
            const orderItems = order.itens.some((item) =>
                item.prato.nome.toLowerCase().includes(query)
            );

            const orderStatus = order.status.toLowerCase().includes(query);

            return clientName || orderItems || orderStatus;
        });
    };

    const columns = [
        {
            header: 'Cliente',
            render: (order) => order.cliente?.nome,
        },
        {
            header: 'Items do pedido',
            render: (order) => (
                <div>
                    {order.itens.map((item, index) => {
                        if (index === 0) {
                            return <span key={index}>{item?.prato?.nome}</span>;
                        } else if (index === 1) {
                            return (
                                <Tooltip key={index} title={order.itens.slice(1).map(item => item?.prato?.nome).join(', ')}>
                                    <span> +{order.itens.length - 1}</span>
                                </Tooltip>
                            );
                        } else {
                            return null;
                        }
                    })}
                </div>
            ),
        },


        {
            header: 'Status',
            render: (order) => getPatternedStatusName(order.status),
        },
        {
            header: 'Ações',
            render: (order) => (
                <>
                    <button onClick={() => handleOpenModalInfo(order)}>
                        <InfoIcon />
                    </button>
                    <button className='ml-1' onClick={() => handleOpenModalStatus(order)}>
                        <EditIcon />
                    </button>
                    <button
                        className={`ml-1 ${order.status === 'ENTREGUE' || order.status === 'CANCELADO' ? 'cursor-not-allowed opacity-50' : ''}`}
                        onClick={() => handleOpenModalCancel(order)}
                        disabled={order.status === 'ENTREGUE' || order.status === 'CANCELADO'}
                    >
                        <CancelIcon />
                    </button>
                </>
            ),
        },

    ];


    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Pedidos</h1>

            <div className="flex items-center justify-between mb-4">
                <div className="w-52">
                    <Input
                        type="text"
                        id="searchQuery"
                        placeHolder="Cliente, items ou status"
                        onChange={handleSearch}
                        label="Pesquisar"
                    />
                </div>
                <div>
                    <label className="mr-2">Restaurante está:</label>
                    <ToggleButton isOpen={isOpen} toggleOpen={toggleOpen} />
                </div>
            </div>
            <Modal
                isOpen={openModalInfo}
                title="Informações do pedido"
                onSave={handleCloseModalInfo}
                onCancel={handleCloseModalInfo}
                labelButtonSave="Fechar"
            >
                {selectedOrder && (
                    <div>
                        <h3 className="font-bold">Detalhes do Cliente</h3>
                        <p>Nome: {selectedOrder.cliente.nome}</p>
                        <p>Email: {selectedOrder.cliente.email}</p>

                        <h3 className="font-bold mt-4">Detalhes do Pedido</h3>
                        {selectedOrder.itens.map((item, index) => (
                            <div key={index} className="border-t border-gray-200 mt-2 pt-2">
                                <p>Nome do Prato: {item.prato.nome}</p>
                                <p>Preço: {item.prato.preco}</p>
                                <p>Quantidade: {item.quantidade}</p>
                                <p>Observações: {item.observacoes}</p>
                            </div>
                        ))}

                        <h3 className="font-bold mt-4">Endereço de Entrega</h3>
                        <p>Rua: {selectedOrder.enderecoEntrega.rua}</p>
                        <p>Bairro: {selectedOrder.enderecoEntrega.bairro}</p>
                        <p>Cidade: {selectedOrder.enderecoEntrega.cidade}</p>
                        <p>Estado: {selectedOrder.enderecoEntrega.estado}</p>
                    </div>
                )}
            </Modal>
            <Modal
                isOpen={openModalStatus}
                title="Alterar status do pedido"
                onSave={handleSaveModalStatus}
                onCancel={handleCloseModalStatus}
                disabledButton={selectedOrder?.status === 'ENTREGUE'}
                labelButtonSave="Mudar status"
                labelButtonCancel="Cancelar"
            >
                {selectedOrder && <OrderStatusStepper currentStatus={selectedOrder.status} />}
            </Modal>
            <Modal
                isOpen={openModalCancel}
                title="Cancelar Pedido"
                onSave={handleCancelPedido}
                onCancel={handleCloseModalCancel}
                labelButtonSave="Cancelar Pedido"
                labelButtonCancel="Fechar"
            >
                <p>Tem certeza que deseja cancelar o pedido?</p>
            </Modal>
            <Toast
                isVisible={toastVisible}
                type={toastType}
                title={toastTitle}
                message={toastMessage}
                duration={3000}
                onDismiss={() => setToastVisible(false)}
            />
            <DataTable columns={columns} data={orders} />
        </div>
    );
};

export default OrderPage;
