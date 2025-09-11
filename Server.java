import java.io.*;
import java.net.*;
import java.util.Scanner;
import java.util.concurrent.CopyOnWriteArrayList;

public class Server {
    private static CopyOnWriteArrayList<ClientHandler> clients = new CopyOnWriteArrayList<>();

    public static void main(String[] args) {
        try {
            PrintWriter logWriter = new PrintWriter(new FileWriter("server.log", true));
            ServerSocket serverSocket = new ServerSocket(1234);
            System.out.println("Server is running and waiting for connections ...");

            new Thread(() -> {
                Scanner scanner = new Scanner(System.in);
                while (true) {
                    String serverMessage = scanner.nextLine();
                    broadcast("[Server]: " + serverMessage, null);
                }
            }).start();

            while (true) {
                Socket clientSocket = serverSocket.accept();
                System.out.println("New client connected: " + clientSocket);

                ClientHandler clientHandler = new ClientHandler(clientSocket, logWriter);
                clients.add(clientHandler);
                new Thread(clientHandler).start();
            }
        } catch (IOException e) {
            System.out.println(e);
        }
    }

    private static void broadcast(String message, ClientHandler sender) {
        for (ClientHandler client : clients) {
            if (client != sender) {
                client.sendMessage(message);
            }
        }
    }

    private static void logMessage(PrintWriter logWriter, String message) {
        logWriter.println(message);
        logWriter.flush();
    }

    private static class ClientHandler implements Runnable {
        private Socket clientSocket;
        private PrintWriter out;
        private BufferedReader in;
        private String username;
        private PrintWriter logWriter;
        private Encryption enc = new Encryption();

        public static final String ANSI_RESET = "\u001B[0m";
        public static final String ANSI_YELLOW = "\u001B[33m";
        public static final String ANSI_RED = "\u001B[41m";
        public static final String ANSI_BLUE = "\u001B[44m";
        public static final String ANSI_GREEN = "\u001B[42m";

        public ClientHandler(Socket socket, PrintWriter logWriter) {
            this.clientSocket = socket;
            this.logWriter = logWriter;

            try {
                out = new PrintWriter(clientSocket.getOutputStream(), true);
                in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
            } catch (IOException e) {
                System.out.println(e);
            }
        }

        @Override
        public void run() {
            try {
                sendMessage("Send your special message:");

                String magic = "Software Product Lines";

                while(!receiveMessage().equals(magic)) {}

                sendMessage("Enter your username:");

                username = receiveMessage();
                System.out.println("User " + username + " connected.");
                sendMessage("Welcome to the chat, " + username + "!");

                sendMessage("What color do you want your outgoing messages to be?");
                String color = receiveMessage(); 
                String textcolour = ANSI_RESET;
                switch (color){
                    case "green" -> textcolour = ANSI_GREEN;
                    case "red" -> textcolour = ANSI_RED;
                    case "blue" -> textcolour = ANSI_BLUE;
                    case "yellow" -> textcolour = ANSI_YELLOW;
                }
                sendMessage("Type your message:");

                String inputLine;
                while ((inputLine = receiveMessage()) != null) {
                    String message = "[" + username + "]: " + textcolour + inputLine + ANSI_RESET;
                    System.out.println(message);
                    broadcast(message, this);
                    logMessage(logWriter,"[" + username + "]: " + inputLine);
                }

                clients.remove(this);
                System.out.println("User " + username + " disconnected.");
            } finally {
                try {
                    in.close();
                    out.close();
                    clientSocket.close();
                } catch (IOException e) {
                    System.out.println(e);
                }
            }
        }

        private void sendMessage(String message) {
            out.println(enc.rotRev(message));
        }

        private String receiveMessage() {
            String msg ="";
            try {
                msg = enc.unrotRev(in.readLine());
            } catch (IOException e) {
                System.out.println(e);
            }
            return msg;
        }
    }
}