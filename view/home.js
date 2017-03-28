'use strict';

module.exports = function(res) {
	res.send(`

<div style="position: absolute; top: 10px; left: 0; width: 100%;">
	<div style="margin: 0 auto; width: 70%; min-width: 500px;">
		<h1>API</h1>
			<table>
				<tr>
					<td>GET:/ </td><td> Home. Информационная страница с описанием API и пробными формами.</td>
				</tr>
				<tr>
					<td>POST:/register </td><td> Регистрация пользователя. Принимает login и password.</td>
				</tr>
				<tr>
					<td>POST:/login </td><td> Авторизация пользователя. Принимает login и password.</td>
				</tr>
				<tr>
					<td>PUT:/logout </td><td> Деавторизация пользователя. Передавать ничего не надо.</td>
				</tr>
				<tr>
					<td>DELETE:/users/:login </td><td> Удаление пользователя. Передается login.</td>
				</tr>
				<tr>
					<td>GET:/users </td><td> Получение всех пользователей (с комментариями но без сортировки).</td>
				</tr>
				<tr>
					<td>GET:/users/comments-count </td><td> Получение пользователей с количеством комментариев и отсортированных.</td>
				</tr>
				<tr>
					<td>POST:/comments </td><td> Добавление комментария.</td>
				</tr>
				<tr>
					<td>GET:/comments </td><td> Получение списка комментариев в виде массива.</td>
				</tr>
				<tr>
					<td>GET:/comments/tree </td><td> Получение списка комментариев в виде дерева.</td>
				</tr>
				<tr>
					<td>404 </td><td> Все остальное.</td>
				</tr>
			</table>
		<hr />
		<h1>Зарегистрировать пользователя</h1>
		<form method="POST" action="/register" style="border: 1px #777 solid; width: 400px;">
			<table>
				<tr>
					<th>Логин </th><td><input type="text" name="login"></td>
				</tr>
				<tr>
					<th>Пароль </th><td><input type="text" name="password"></td>
				</tr>
				<tr>
					<td></td><td><input type="submit" value="Отправить"></td>
				</tr>
			</table>
		</form>
		<hr />
		<h1>Авторизовать пользователя</h1>
		<form method="POST" action="/login" style="border: 1px #777 solid; width: 400px;">
			<table>
				<tr>
					<th>Логин </th><td><input type="text" name="login"></td>
				</tr>
				<tr>
					<th>Пароль </th><td><input type="text" name="password"></td>
				</tr>
				<tr>
					<td></td><td><input type="submit" value="Отправить"></td>
				</tr>
			</table>
		</form>
		<hr />
		<h1>Оставить комментарий</h1>
		<form method="POST" action="/comments" style="border: 1px #777 solid; width: 400px;">
			<table>
				<tr>
					<th>Имя </th><td><input type="text" name="login"></td>
				</tr>
				<tr>
					<th>Заголовок </th><td><input type="text" name="title"></td>
				</tr>
				<tr>
					<th>Текст </th><td><textarea name="text"></textarea></td>
				</tr>
				<tr>
					<th>ID родительского коменнтария </th><td><input type="text" name="parentId"></td>
				</tr>
				<tr>
					<td></td><td><input type="submit" value="Отправить"></td>
				</tr>
			</table>
		</form>
	</div>
</div>

		`);
}